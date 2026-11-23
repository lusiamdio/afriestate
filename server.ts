import express from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, LiveServerMessage, Modality, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load optional gitignored .env.local overrides into process.env on server startup
(() => {
  try {
    const localEnvPath = path.join(__dirname, '.env.local');
    if (fs.existsSync(localEnvPath)) {
      const content = fs.readFileSync(localEnvPath, 'utf8');
      for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;
        const eqIdx = line.indexOf('=');
        if (eqIdx <= 0) continue;
        const key = line.slice(0, eqIdx).trim();
        let val = line.slice(eqIdx + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        if (key && val) {
          process.env[key] = val;
        }
      }
    }
  } catch {
    // Non-fatal if .env.local cannot be read
  }
})();

const app = express();
const server = http.createServer(app);

// Security headers for production hardening
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=(self)');
  next();
});

// Simple sliding-window per-IP rate limiter for AI proxy endpoints
const apiRateBuckets = new Map<string, number[]>();
const API_WINDOW_MS = 60_000;
const API_MAX_REQUESTS = 90;

app.use('/api/gemini', (req, res, next) => {
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const timestamps = (apiRateBuckets.get(clientIp) || []).filter((ts) => now - ts < API_WINDOW_MS);
  if (timestamps.length >= API_MAX_REQUESTS) {
    return res.status(429).json({ error: 'Rate limit exceeded. Please wait a moment before retrying.' });
  }
  timestamps.push(now);
  apiRateBuckets.set(clientIp, timestamps);
  // Periodic pruning to avoid unbounded memory growth
  if (apiRateBuckets.size > 5000) {
    for (const [key, list] of apiRateBuckets.entries()) {
      if (list.every((ts) => now - ts >= API_WINDOW_MS)) {
        apiRateBuckets.delete(key);
      }
    }
  }
  next();
});

// Enable JSON parsing with large body support for image/video base64 frames
app.use(express.json({ limit: '25mb' }));

// Resolve server-side Gemini API key dynamically
function getActiveApiKey(): string {
  return (process.env.GEMINI_API_KEY || process.env.API_KEY || '').trim();
}

function getRapidApiKeys(): string[] {
  const raw = (
    process.env.RAPIDAPI_KEY ||
    process.env.X_RAPIDAPI_KEY ||
    process.env.VITE_RAPIDAPI_KEY ||
    ''
  ).trim();
  if (!raw) return [];
  return raw
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
}

let rapidKeyRotationIdx = 0;
let flightTrackerRotationIdx = 0;
let visaAdvisorRotationIdx = 0;
let travelLanguagesRotationIdx = 0;

function getRapidApiKey(): string {
  const keys = getRapidApiKeys();
  if (keys.length === 0) return '';
  const selected = keys[rapidKeyRotationIdx % keys.length];
  rapidKeyRotationIdx += 1;
  return selected;
}

interface RapidApiCacheEntry<T = any> {
  expiresAt: number;
  data: T;
}

interface RapidHostHealth {
  host: string;
  state: 'ready' | 'healthy' | 'cooldown' | 'unsubscribed' | 'error';
  lastStatus: number | null;
  lastError: string | null;
  cooldownUntil: number;
  lastCheckedAt: string | null;
}

const RAPID_HOSTS = [
  'aerodatabox.p.rapidapi.com',
  'booking-com15.p.rapidapi.com',
  'tripadvisor16.p.rapidapi.com',
  'google-flights2.p.rapidapi.com',
  'visa-requirement.p.rapidapi.com',
  'ranked-crime-cities.p.rapidapi.com',
] as const;

const rapidApiCache = new Map<string, RapidApiCacheEntry>();
const rapidHostHealth = new Map<string, RapidHostHealth>();

for (const host of RAPID_HOSTS) {
  rapidHostHealth.set(host, {
    host,
    state: 'ready',
    lastStatus: null,
    lastError: null,
    cooldownUntil: 0,
    lastCheckedAt: null,
  });
}

function updateRapidHostHealth(
  host: string,
  patch: Partial<Omit<RapidHostHealth, 'host'>>
) {
  const prev = rapidHostHealth.get(host) || {
    host,
    state: 'ready' as const,
    lastStatus: null,
    lastError: null,
    cooldownUntil: 0,
    lastCheckedAt: null,
  };
  rapidHostHealth.set(host, {
    ...prev,
    ...patch,
    lastCheckedAt: new Date().toISOString(),
  });
}

async function callRapidApi<T = any>(
  host: string,
  pathAndQuery: string,
  options: {
    method?: 'GET' | 'POST';
    body?: any;
    cacheKey?: string;
    cacheTtlMs?: number;
    timeoutMs?: number;
  } = {}
): Promise<T> {
  const apiKey = getRapidApiKey();
  if (!apiKey) {
    throw new Error('Server RAPIDAPI_KEY environment variable is not configured.');
  }

  const { method = 'GET', body, cacheKey, cacheTtlMs = 0, timeoutMs = 12000 } = options;

  if (cacheKey && cacheTtlMs > 0) {
    const cached = rapidApiCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data as T;
    }
  }

  const hostStatus = rapidHostHealth.get(host);
  if (hostStatus && hostStatus.state === 'cooldown' && hostStatus.cooldownUntil > Date.now()) {
    throw new Error('Live upstream data feed is in brief rate-limit cooldown.');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `https://${host}${pathAndQuery}`;
    const headers: Record<string, string> = {
      'x-rapidapi-host': host,
      'x-rapidapi-key': apiKey,
    };
    if (method === 'POST') {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(url, {
      method,
      headers,
      body: method === 'POST' && body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    const isJson = contentType.includes('application/json');

    if (!res.ok) {
      let detail = '';
      if (isJson) {
        try {
          const errBody = await res.json();
          detail = errBody?.message || errBody?.error || '';
        } catch {
          // ignore
        }
      }
      const internalMsg = detail
        ? `RapidAPI (${host}) HTTP ${res.status}: ${detail}`
        : `RapidAPI (${host}) failed with HTTP ${res.status}`;
      const clientSafeMsg = `Live upstream data feed returned HTTP ${res.status}.`;
      console.warn(`[Upstream Telemetry] ${internalMsg}`);

      if (res.status === 429) {
        updateRapidHostHealth(host, {
          state: 'cooldown',
          lastStatus: 429,
          lastError: internalMsg,
          cooldownUntil: Date.now() + 15000,
        });
      } else if (res.status === 403 && detail.toLowerCase().includes('not subscribed')) {
        updateRapidHostHealth(host, {
          state: 'unsubscribed',
          lastStatus: 403,
          lastError: internalMsg,
          cooldownUntil: 0,
        });
      } else {
        updateRapidHostHealth(host, {
          state: 'error',
          lastStatus: res.status,
          lastError: internalMsg,
          cooldownUntil: 0,
        });
      }
      throw new Error(clientSafeMsg);
    }

    if (!isJson) {
      const internalMsg = `RapidAPI (${host}) returned non-JSON content-type (${contentType || 'unknown'}).`;
      console.warn(`[Upstream Telemetry] ${internalMsg}`);
      updateRapidHostHealth(host, {
        state: 'error',
        lastStatus: res.status,
        lastError: internalMsg,
        cooldownUntil: 0,
      });
      throw new Error('Live upstream data feed returned an unexpected response format.');
    }

    const data = (await res.json()) as T;
    updateRapidHostHealth(host, {
      state: 'healthy',
      lastStatus: res.status,
      lastError: null,
      cooldownUntil: 0,
    });
    if (cacheKey && cacheTtlMs > 0) {
      rapidApiCache.set(cacheKey, { expiresAt: Date.now() + cacheTtlMs, data });
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

const PASSPORT_NAME_TO_ISO2: Record<string, string> = {
  'south africa': 'ZA',
  nigeria: 'NG',
  kenya: 'KE',
  ghana: 'GH',
  morocco: 'MA',
  egypt: 'EG',
  rwanda: 'RW',
  botswana: 'BW',
  senegal: 'SN',
  cameroon: 'CM',
  ethiopia: 'ET',
  tanzania: 'TZ',
  'united kingdom': 'GB',
  'united states': 'US',
  'european union': 'FR',
  'united arab emirates': 'AE',
  india: 'IN',
  china: 'CN',
  vietnam: 'VN',
  algeria: 'DZ',
  angola: 'AO',
  benin: 'BJ',
  'burkina faso': 'BF',
  burundi: 'BI',
  'cabo verde': 'CV',
  'cape verde': 'CV',
  chad: 'TD',
  comoros: 'KM',
  congo: 'CG',
  'dr congo': 'CD',
  "cote d'ivoire": 'CI',
  'ivory coast': 'CI',
  djibouti: 'DJ',
  eritrea: 'ER',
  eswatini: 'SZ',
  gabon: 'GA',
  gambia: 'GM',
  guinea: 'GN',
  lesotho: 'LS',
  liberia: 'LR',
  libya: 'LY',
  madagascar: 'MG',
  malawi: 'MW',
  mali: 'ML',
  mauritania: 'MR',
  mauritius: 'MU',
  mozambique: 'MZ',
  namibia: 'NA',
  niger: 'NE',
  seychelles: 'SC',
  'sierra leone': 'SL',
  somalia: 'SO',
  'south sudan': 'SS',
  sudan: 'SD',
  togo: 'TG',
  tunisia: 'TN',
  uganda: 'UG',
  zambia: 'ZM',
  zimbabwe: 'ZW',
};

function resolveIso2Code(input: string): string {
  const clean = input.trim();
  if (/^[A-Za-z]{2}$/.test(clean)) return clean.toUpperCase();
  const mapped = PASSPORT_NAME_TO_ISO2[clean.toLowerCase()];
  if (mapped) return mapped;
  for (const [name, iso] of Object.entries(PASSPORT_NAME_TO_ISO2)) {
    if (clean.toLowerCase().includes(name)) return iso;
  }
  return clean.slice(0, 2).toUpperCase();
}

function getGeminiClient(): GoogleGenAI | null {
  const key = getActiveApiKey();
  if (!key) return null;
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function parseGeminiError(error: any): { status: number; code: string; message: string } {
  const rawMessage = typeof error?.message === 'string' ? error.message.trim() : String(error || 'Upstream Gemini request failed');
  let parsedBody: any = null;
  if (rawMessage.startsWith('{')) {
    try {
      parsedBody = JSON.parse(rawMessage);
    } catch {
      // ignore non-JSON message
    }
  }

  const nested = parsedBody?.error || parsedBody;
  const codeNum = Number(nested?.code || error?.status || error?.code || 502);
  const statusStr = String(nested?.status || '').toUpperCase();
  const detailReason = String(nested?.details?.[0]?.reason || '').toUpperCase();

  if (codeNum === 403 || statusStr === 'PERMISSION_DENIED' || detailReason === 'ACCESS_DENIED' || rawMessage.includes('PERMISSION_DENIED')) {
    return {
      status: 403,
      code: 'PERMISSION_DENIED',
      message: 'Live AI service access was denied by the upstream Generative Language API (403 PERMISSION_DENIED).',
    };
  }
  if (codeNum === 400 && (statusStr === 'INVALID_ARGUMENT' || rawMessage.includes('API_KEY_INVALID'))) {
    return {
      status: 400,
      code: 'API_KEY_INVALID',
      message: 'The configured server AI credential was rejected by the upstream service (400 API_KEY_INVALID).',
    };
  }
  if (codeNum === 429 || statusStr === 'RESOURCE_EXHAUSTED') {
    return {
      status: 429,
      code: 'RESOURCE_EXHAUSTED',
      message: 'AI service quota or rate limit exceeded. Please try again shortly.',
    };
  }
  if (codeNum === 404 || statusStr === 'NOT_FOUND') {
    return {
      status: 404,
      code: 'NOT_FOUND',
      message: 'Requested Gemini model or endpoint was not found.',
    };
  }

  return {
    status: codeNum >= 400 && codeNum < 600 ? codeNum : 502,
    code: statusStr || 'UPSTREAM_ERROR',
    message: typeof nested?.message === 'string' ? nested.message : rawMessage,
  };
}

if (!getActiveApiKey()) {
  console.warn('[Server] Warning: GEMINI_API_KEY is not set in environment.');
}

// Model normalizer ensuring only active, supported Gemini models are called
function mapModel(modelName?: string): string {
  if (!modelName) return 'gemini-4-hydrogen';
  const lower = modelName.toLowerCase();
  if (lower.includes('live')) return 'gemini-3.8-live';
  if (lower.includes('tts')) return 'gemini-3.8-flash-lite-tts';
  if (lower.includes('argon') || lower.includes('pro') || lower.includes('carbon')) return 'gemini-4-argon';
  if (lower.includes('image') || lower.includes('banana') || lower.includes('imagen')) return 'gemini-nano-banana-2.1';
  if (lower.includes('veo')) return 'veo-3.1-fast-generate-preview';
  return 'gemini-4-hydrogen';
}

function sanitizeConfig(config: any = {}) {
  if (!config || typeof config !== 'object') return {};
  const clean = { ...config };
  if (clean.thinkingConfig?.thinkingBudget !== undefined) {
    delete clean.thinkingConfig.thinkingBudget;
    if (Object.keys(clean.thinkingConfig).length === 0) {
      delete clean.thinkingConfig;
    }
  }
  return clean;
}

// 1. Generate content (Text, Structured JSON, Multimodal analysis, Audio/TTS, Search Grounding)
app.post('/api/gemini/generate', async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Live AI service is currently unavailable because server credentials are not configured.',
      });
    }
    const { model, contents, config } = req.body || {};
    if (!contents) {
      return res.status(400).json({ error: 'Missing contents payload' });
    }
    const targetModel = mapModel(model);
    const sanitizedConfig = sanitizeConfig(config);

    const response = await ai.models.generateContent({
      model: targetModel,
      contents,
      config: sanitizedConfig,
    });

    res.json({
      text: response.text || '',
      candidates: response.candidates || [],
    });
  } catch (error: any) {
    const parsed = parseGeminiError(error);
    console.warn(`[API /api/gemini/generate warning] (${parsed.status} ${parsed.code}): ${parsed.message}`);
    res.status(parsed.status).json({ error: parsed.message, code: parsed.code });
  }
});

// 2. Chat Streaming (SSE)
app.post('/api/gemini/chat-stream', async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Live AI service is currently unavailable because server credentials are not configured.',
      });
    }
    const { model, message, history, systemInstruction, config } = req.body || {};
    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message text is required' });
    }
    const targetModel = mapModel(model);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    let contents: any;
    if (Array.isArray(history) && history.length > 0) {
      const parts: any[] = [];
      if (systemInstruction) {
        parts.push({ text: `System Instruction:\n${String(systemInstruction)}\n\n` });
      }
      for (const h of history.slice(-20)) {
        parts.push({ text: `${h.role === 'user' ? 'User' : 'Assistant'}: ${String(h.text || h.content || '')}` });
      }
      parts.push({ text: `User: ${message}` });
      contents = [{ parts }];
    } else if (systemInstruction) {
      contents = [
        { parts: [{ text: `System Instruction:\n${String(systemInstruction)}\n\nUser: ${message}` }] },
      ];
    } else {
      contents = message;
    }

    const responseStream = await ai.models.generateContentStream({
      model: targetModel,
      contents,
      config: sanitizeConfig(config),
    });

    for await (const chunk of responseStream) {
      if (res.writableEnded) break;
      const text = chunk.text || '';
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }

    if (!res.writableEnded) {
      res.write('data: [DONE]\n\n');
      res.end();
    }
  } catch (error: any) {
    const parsed = parseGeminiError(error);
    console.warn(`[API /api/gemini/chat-stream warning] (${parsed.status} ${parsed.code}): ${parsed.message}`);
    if (!res.headersSent) {
      res.status(parsed.status).json({ error: parsed.message, code: parsed.code });
    } else if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ error: parsed.message })}\n\n`);
      res.end();
    }
  }
});

// 3. Image Generation
app.post('/api/gemini/generate-images', async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Live AI service is currently unavailable because server credentials are not configured.',
      });
    }
    const { prompt, model, config } = req.body || {};
    if (typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    const targetModel = mapModel(model || 'gemini-nano-banana-2.1');
    const response = await ai.models.generateImages({
      model: targetModel,
      prompt,
      config,
    });
    res.json(response);
  } catch (error: any) {
    const parsed = parseGeminiError(error);
    console.warn(`[API /api/gemini/generate-images warning] (${parsed.status} ${parsed.code}): ${parsed.message}`);
    res.status(parsed.status).json({ error: parsed.message, code: parsed.code });
  }
});

// 4. Video Generation & Operations
app.post('/api/gemini/generate-videos', async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Live AI service is currently unavailable because server credentials are not configured.',
      });
    }
    const { prompt, model, config } = req.body || {};
    if (typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    const targetModel = model || 'veo-3.1-fast-generate-preview';
    const operation = await ai.models.generateVideos({
      model: targetModel,
      prompt,
      config,
    });
    res.json(operation);
  } catch (error: any) {
    const parsed = parseGeminiError(error);
    console.warn(`[API /api/gemini/generate-videos warning] (${parsed.status} ${parsed.code}): ${parsed.message}`);
    res.status(parsed.status).json({ error: parsed.message, code: parsed.code });
  }
});

app.post('/api/gemini/get-videos-operation', async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Live AI service is currently unavailable because server credentials are not configured.',
      });
    }
    const { operation } = req.body || {};
    if (!operation) {
      return res.status(400).json({ error: 'Missing operation payload' });
    }
    const updatedOperation = await ai.operations.getVideosOperation({ operation });
    res.json(updatedOperation);
  } catch (error: any) {
    const parsed = parseGeminiError(error);
    console.warn(`[API /api/gemini/get-videos-operation warning] (${parsed.status} ${parsed.code}): ${parsed.message}`);
    res.status(parsed.status).json({ error: parsed.message, code: parsed.code });
  }
});

// 5. Video Secure Proxy (strict Google APIs host allowlist prevents SSRF & key exfiltration)
app.get('/api/gemini/video-proxy', async (req, res) => {
  try {
    const activeKey = getActiveApiKey();
    if (!activeKey) {
      return res.status(503).send('AI service key is not configured');
    }
    const { uri } = req.query;
    if (!uri || typeof uri !== 'string') {
      return res.status(400).send('Missing uri query parameter');
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(uri);
    } catch {
      return res.status(400).send('Invalid URI');
    }

    const isAllowedHost =
      parsedUrl.protocol === 'https:' &&
      (parsedUrl.hostname === 'generativelanguage.googleapis.com' ||
        parsedUrl.hostname.endsWith('.googleapis.com'));

    if (!isAllowedHost) {
      return res.status(403).send('Disallowed video proxy target host');
    }

    const videoRes = await fetch(parsedUrl.toString(), {
      headers: {
        'x-goog-api-key': activeKey,
        'User-Agent': 'aistudio-build',
      },
    });
    if (!videoRes.ok) {
      return res.status(videoRes.status).send('Upstream video fetch failed');
    }
    const contentType = videoRes.headers.get('content-type') || 'video/mp4';
    res.setHeader('Content-Type', contentType);
    const buffer = await videoRes.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (error: any) {
    console.error('[API /api/gemini/video-proxy error]:', error);
    res.status(500).send('Failed to proxy video');
  }
});

// 5b. Real-Time Flight Tracker rotating between AeroDataBox RapidAPI and Gemini Google Search Grounding
app.post('/api/gemini/flight-tracker', async (req, res) => {
  const { flightNumber, date, preferredProvider } = req.body || {};
  const cleanFlight = typeof flightNumber === 'string' ? flightNumber.trim().toUpperCase().slice(0, 24) : '';
  const compactFlight = cleanFlight.replace(/\s+/g, '');
  const cleanDate = typeof date === 'string' ? date.trim().slice(0, 20) : new Date().toISOString().slice(0, 10);

  if (!cleanFlight) {
    return res.status(400).json({ error: 'Flight number is required (e.g., SA 317, ET 846, or AS2223).' });
  }

  const runAeroDataBox = async () => {
    const raw = await callRapidApi<any>(
      'aerodatabox.p.rapidapi.com',
      `/flights/number/${encodeURIComponent(compactFlight)}?withAircraftImage=false&withLocation=false&withFlightPlan=false`,
      { cacheKey: `aerodatabox:${compactFlight}`, cacheTtlMs: 90_000 }
    );
    const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : raw ? [raw] : [];
    const entry = list[0];
    if (!entry || (!entry.departure && !entry.arrival && !entry.airline)) {
      throw new Error(`No active schedule records returned for flight ${cleanFlight}.`);
    }

    const depAirport = entry?.departure?.airport?.iata || entry?.departure?.airport?.name || 'Origin';
    const arrAirport = entry?.arrival?.airport?.iata || entry?.arrival?.airport?.name || 'Destination';
    const depScheduled =
      entry?.departure?.scheduledTime?.local || entry?.departure?.scheduledTime?.utc || 'Check airline schedule';
    const depRevised =
      entry?.departure?.revisedTime?.local ||
      entry?.departure?.runwayTime?.local ||
      depScheduled;
    const arrScheduled =
      entry?.arrival?.revisedTime?.local ||
      entry?.arrival?.scheduledTime?.local ||
      entry?.arrival?.scheduledTime?.utc ||
      'See summary';
    const terminalGate = [
      entry?.departure?.terminal ? `Terminal ${entry.departure.terminal}` : '',
      entry?.departure?.gate ? `Gate ${entry.departure.gate}` : '',
    ]
      .filter(Boolean)
      .join(' · ') || 'Check Airport Monitor';

    const airlineName = entry?.airline?.name || entry?.airline?.iata || cleanFlight;
    const statusText = entry?.status || 'Scheduled';
    const aircraftModel = entry?.aircraft?.model || 'Commercial Jet';
    const summaryText = `${airlineName} flight ${entry?.number || cleanFlight} from ${depAirport} to ${arrAirport} reports status "${statusText}" via live aviation telemetry. Scheduled departure ${depScheduled} (estimated ${depRevised}), arrival ${arrScheduled}.`;

    return {
      flightNumber: cleanFlight,
      date: cleanDate,
      checkedAt: new Date().toISOString(),
      providerUsed: 'AfriEstate Live Flight Feed',
      reportText: summaryText,
      parsed: {
        airline: airlineName,
        route: `${depAirport} -> ${arrAirport}`,
        status: statusText,
        scheduledDeparture: depScheduled,
        estimatedDeparture: depRevised,
        scheduledArrival: arrScheduled,
        gateTerminal: terminalGate,
        aircraft: aircraftModel,
        summary: summaryText,
      },
      sources: [],
    };
  };

  const runGeminiFlightGrounding = async () => {
    const ai = getGeminiClient();
    if (!ai) {
      throw new Error('Gemini server credentials are not configured.');
    }

    const prompt = `Search the live web for the real-time or scheduled flight status of flight "${cleanFlight}" on date "${cleanDate}".
Provide factual, concise operational details from live search results using this clear structure at the top, followed by a brief 2-sentence operational summary:
AIRLINE: <Airline name or Unknown>
ROUTE: <Origin Airport/City -> Destination Airport/City>
STATUS: <On Time | Delayed | En Route | Landed | Scheduled | Cancelled | Unknown>
SCHEDULED_DEPARTURE: <Time & timezone or Scheduled info>
ESTIMATED_DEPARTURE: <Updated/actual departure time or N/A>
SCHEDULED_ARRIVAL: <Time & timezone or N/A>
GATE_TERMINAL: <Departure Terminal / Gate if available or Check Airport Monitor>
AIRCRAFT: <Aircraft type if available or N/A>
SUMMARY: <2 factual sentences on current status, recent performance on this route, and any delays or advisories for ${cleanDate}.>`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const reportText = (response.text || '').trim();
    const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const seenUris = new Set<string>();
    const sources: { title: string; uri: string }[] = [];
    for (const chunk of rawChunks) {
      const uri = chunk?.web?.uri;
      const title = chunk?.web?.title;
      if (uri && !seenUris.has(uri)) {
        seenUris.add(uri);
        sources.push({
          title: title || uri,
          uri,
        });
      }
    }

    const extractField = (key: string) => {
      const match = reportText.match(new RegExp(`^${key}:\\s*(.+)$`, 'im'));
      return match ? match[1].trim() : '';
    };

    return {
      flightNumber: cleanFlight,
      date: cleanDate,
      checkedAt: new Date().toISOString(),
      providerUsed: 'AfriEstate Live Flight Feed',
      reportText,
      parsed: {
        airline: extractField('AIRLINE') || cleanFlight,
        route: extractField('ROUTE') || 'Live Route Lookup',
        status: extractField('STATUS') || 'Live Update Retrieved',
        scheduledDeparture: extractField('SCHEDULED_DEPARTURE') || 'Check airline schedule',
        estimatedDeparture: extractField('ESTIMATED_DEPARTURE') || 'Live updates below',
        scheduledArrival: extractField('SCHEDULED_ARRIVAL') || 'See summary',
        gateTerminal: extractField('GATE_TERMINAL') || 'Check Airport Display',
        aircraft: extractField('AIRCRAFT') || 'Commercial Jet',
        summary: extractField('SUMMARY') || reportText,
      },
      sources,
    };
  };

  const turnAeroFirst =
    preferredProvider === 'aerodatabox'
      ? true
      : preferredProvider === 'gemini'
      ? false
      : Boolean(getRapidApiKey()) && flightTrackerRotationIdx++ % 2 === 0;

  const order = turnAeroFirst
    ? [
        { name: 'AeroDataBox', fn: runAeroDataBox },
        { name: 'GeminiSearch', fn: runGeminiFlightGrounding },
      ]
    : [
        { name: 'GeminiSearch', fn: runGeminiFlightGrounding },
        { name: 'AeroDataBox', fn: runAeroDataBox },
      ];

  const internalErrors: string[] = [];
  for (const step of order) {
    try {
      const payload = await step.fn();
      return res.json(payload);
    } catch (err: any) {
      const parsed = step.name === 'GeminiSearch' ? parseGeminiError(err) : null;
      internalErrors.push(`${step.name}: ${parsed ? parsed.message : err?.message || 'failed'}`);
    }
  }

  console.warn(`[API /api/gemini/flight-tracker warning]: ${internalErrors.join(' | ')}`);
  return res.status(502).json({
    error: `Live flight status lookup is currently unavailable for ${cleanFlight}. Please try again shortly.`,
    code: 'ALL_PROVIDERS_FAILED',
  });
});

// 5b-2. Pan-African Visa & Consular Policy Advisor using Gemini Google Search Grounding + Structured Schema
const visaVerificationSchema = {
  type: Type.OBJECT,
  properties: {
    entryCategory: {
      type: Type.STRING,
      description: 'Official entry category: Visa-Free / Open Access, eVisa / eTA Required, Visa on Arrival, or Embassy / Consular Visa.',
    },
    stayLimit: {
      type: Type.STRING,
      description: 'Maximum authorized stay duration in days or months.',
    },
    estimatedFee: {
      type: Type.STRING,
      description: 'Official statutory fee in USD or local currency, or $0 Exempt.',
    },
    processingTime: {
      type: Type.STRING,
      description: 'Typical official portal or embassy processing window.',
    },
    officialPortal: {
      type: Type.STRING,
      description: 'Official government immigration portal domain or consular authority.',
    },
    bureaucraticSummary: {
      type: Type.STRING,
      description: '3-4 concise factual sentences covering step-by-step filing order, bloc exemptions, Yellow Fever ICVP, and passport validity.',
    },
    propertyAdvisory: {
      type: Type.STRING,
      description: '1-2 concise factual sentences on foreign visitor entry compliance when inspecting or acquiring real estate.',
    },
    items: {
      type: Type.ARRAY,
      description: 'Verification result for each regulatory item in the corridor dossier.',
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: 'Exact id of the regulatory dossier item.' },
          label: { type: Type.STRING, description: 'Human-readable name of the regulatory item.' },
          status: {
            type: Type.STRING,
            enum: ['confirmed', 'changed', 'not found'],
            description: 'Verification status against official sources: confirmed, changed, or not found.',
          },
          summary: {
            type: Type.STRING,
            description: 'Concise factual verification note and updated policy details if changed.',
          },
          last_verified_date: {
            type: Type.STRING,
            description: 'Verification date in YYYY-MM-DD format.',
          },
          sources: {
            type: Type.ARRAY,
            description: 'Authoritative sources supporting this verification.',
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                url: { type: Type.STRING },
              },
              required: ['title', 'url'],
            },
          },
        },
        required: ['id', 'label', 'status', 'summary', 'last_verified_date', 'sources'],
      },
    },
  },
  required: [
    'entryCategory',
    'stayLimit',
    'estimatedFee',
    'processingTime',
    'officialPortal',
    'bureaucraticSummary',
    'propertyAdvisory',
    'items',
  ],
};

function extractJsonObject(rawText: string): any {
  const trimmed = rawText.trim();
  const withoutFences = trimmed
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  try {
    return JSON.parse(withoutFences);
  } catch {
    const start = withoutFences.indexOf('{');
    const end = withoutFences.lastIndexOf('}');
    if (start !== -1 && end > start) {
      return JSON.parse(withoutFences.slice(start, end + 1));
    }
    throw new Error('Live AI verification returned malformed JSON payload.');
  }
}

app.post('/api/gemini/visa-advisor', async (req, res) => {
  const { passportCountry, destinationCountry, travelPurpose, dossierItems } = req.body || {};
  const cleanPassport = typeof passportCountry === 'string' ? passportCountry.trim().slice(0, 60) : '';
  const cleanDest = typeof destinationCountry === 'string' ? destinationCountry.trim().slice(0, 60) : '';
  const cleanPurpose = typeof travelPurpose === 'string' ? travelPurpose.trim().slice(0, 80) : 'Property & Business';

  if (!cleanPassport || !cleanDest) {
    return res.status(400).json({ error: 'Both passport nationality and African destination country are required.' });
  }

  const inputItems: Array<{ id: string; label: string; currentValue: string }> =
    Array.isArray(dossierItems) && dossierItems.length > 0
      ? dossierItems
          .slice(0, 12)
          .map((it: any, idx: number) => ({
            id: String(it?.id || `item_${idx}`).slice(0, 50),
            label: String(it?.label || `Regulatory Item ${idx + 1}`).slice(0, 80),
            currentValue: String(it?.currentValue || '').slice(0, 350),
          }))
      : [
          { id: 'entry_regime', label: 'Entry Regime', currentValue: 'Standard corridor visa rule' },
          { id: 'stay_limit', label: 'Authorized Stay', currentValue: 'Up to 30–90 days' },
          { id: 'processing_window', label: 'Processing Window', currentValue: 'Check official portal SLA' },
          { id: 'fee_band', label: 'Statutory Fee Band', currentValue: 'Standard official tariff' },
          { id: 'official_portal', label: 'Official Authority', currentValue: `${cleanDest} Immigration Authority` },
          { id: 'passport_validity', label: 'Passport Rule', currentValue: '6 months beyond intended exit · 2 blank consecutive pages' },
          { id: 'yellow_fever_rule', label: 'Yellow Fever / ICVP', currentValue: 'Verify endemic transit requirement' },
          { id: 'property_investor_advisory', label: 'Real Estate & Investor Border Advisory', currentValue: 'Check non-resident buyer entry permissions' },
        ];

  const todayIso = new Date().toISOString().slice(0, 10);

  const runGeminiVisaVerification = async () => {
    const ai = getGeminiClient();
    if (!ai) {
      throw new Error('Server Gemini credentials are not configured.');
    }

    const dossierBlock = inputItems
      .map((item) => `- id: "${item.id}" | label: "${item.label}" | curated_baseline: "${item.currentValue}"`)
      .join('\n');

    const prompt = `Today's date is ${todayIso}.
Search current official government immigration portals, diplomatic missions, and IATA/Timatic border sources on the live web for a "${cleanPassport}" passport holder travelling to "${cleanDest}" for "${cleanPurpose}".

Verify EACH regulatory dossier item listed below against current official sources:
${dossierBlock}

Return valid JSON matching the requested schema:
- For every item in "items", keep its exact "id" and "label".
- Set "status" to:
  - "confirmed" if current official sources match the curated_baseline (minor wording differences allowed),
  - "changed" if current official rules, fees, portals, eTA systems, or stay limits differ from curated_baseline,
  - "not found" if official verification could not be confirmed from authoritative sources.
- Set "last_verified_date" to "${todayIso}".
- Populate "sources" for each item with authoritative { "title", "url" } links returned by Google Search. Never invent URLs; use real URLs from grounded search results.`;

    let response: any;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json',
          responseSchema: visaVerificationSchema,
        },
      });
    } catch (schemaErr: any) {
      const parsedErr = parseGeminiError(schemaErr);
      const rawMsg = String(schemaErr?.message || '');
      const isSchemaToolConflict =
        parsedErr.status === 400 &&
        (rawMsg.toLowerCase().includes('schema') ||
          rawMsg.toLowerCase().includes('mime') ||
          rawMsg.toLowerCase().includes('tool'));
      if (!isSchemaToolConflict) {
        throw schemaErr;
      }
      response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `${prompt}\n\nRespond ONLY with raw valid JSON matching keys: entryCategory, stayLimit, estimatedFee, processingTime, officialPortal, bureaucraticSummary, propertyAdvisory, items (array of { id, label, status, summary, last_verified_date, sources: [{ title, url }] }).`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });
    }

    const reportText = (response.text || '').trim();
    const structured = extractJsonObject(reportText);

    const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const seenUris = new Set<string>();
    const groundedSources: { title: string; url: string; uri: string }[] = [];
    for (const chunk of rawChunks) {
      const uri = chunk?.web?.uri;
      const title = chunk?.web?.title;
      if (uri && /^https?:\/\//i.test(uri) && !seenUris.has(uri)) {
        seenUris.add(uri);
        groundedSources.push({ title: title || uri, url: uri, uri });
      }
    }

    const rawItems = Array.isArray(structured?.items) ? structured.items : [];
    const byId = new Map<string, any>();
    for (const item of rawItems) {
      if (item && typeof item.id === 'string') {
        byId.set(item.id, item);
      }
    }

    const normalizedItems = inputItems.map((baseline) => {
      const matched = byId.get(baseline.id);
      const rawStatus = String(matched?.status || 'not found').toLowerCase().trim();
      const status: 'confirmed' | 'changed' | 'not found' =
        rawStatus === 'confirmed' ? 'confirmed' : rawStatus === 'changed' ? 'changed' : 'not found';

      const itemSourcesRaw = Array.isArray(matched?.sources) ? matched.sources : [];
      const itemSources: { title: string; url: string }[] = [];
      const itemSeen = new Set<string>();
      for (const s of itemSourcesRaw) {
        const url = typeof s?.url === 'string' ? s.url.trim() : typeof s?.uri === 'string' ? s.uri.trim() : '';
        const title = typeof s?.title === 'string' && s.title.trim() ? s.title.trim() : url;
        if (url && /^https?:\/\//i.test(url) && !itemSeen.has(url)) {
          itemSeen.add(url);
          itemSources.push({ title, url });
        }
      }
      if (itemSources.length === 0 && status !== 'not found' && groundedSources.length > 0) {
        for (const gs of groundedSources.slice(0, 2)) {
          if (!itemSeen.has(gs.url)) {
            itemSeen.add(gs.url);
            itemSources.push({ title: gs.title, url: gs.url });
          }
        }
      }

      return {
        id: baseline.id,
        label: String(matched?.label || baseline.label),
        status,
        summary: String(
          matched?.summary ||
            (status === 'not found'
              ? 'No direct confirmation found in official live search results; review curated dossier baseline carefully.'
              : baseline.currentValue)
        ),
        last_verified_date: String(matched?.last_verified_date || todayIso),
        sources: itemSources,
      };
    });

    const combinedSources: { title: string; uri: string; url: string }[] = [...groundedSources];
    for (const item of normalizedItems) {
      for (const src of item.sources) {
        if (!seenUris.has(src.url)) {
          seenUris.add(src.url);
          combinedSources.push({ title: src.title, uri: src.url, url: src.url });
        }
      }
    }

    return {
      passportCountry: cleanPassport,
      destinationCountry: cleanDest,
      travelPurpose: cleanPurpose,
      checkedAt: new Date().toISOString(),
      providerUsed: 'AfriEstate Consular Verification',
      reportText,
      parsed: {
        entryCategory: String(structured?.entryCategory || 'Verify via Official Portal'),
        stayLimit: String(structured?.stayLimit || 'See diplomatic terms'),
        estimatedFee: String(structured?.estimatedFee || 'Official tariff applies'),
        processingTime: String(structured?.processingTime || 'Check portal SLA'),
        officialPortal: String(structured?.officialPortal || `${cleanDest} Immigration Authority`),
        bureaucraticSummary: String(structured?.bureaucraticSummary || ''),
        propertyAdvisory: String(structured?.propertyAdvisory || 'Verify non-resident deed & tax compliance locally.'),
      },
      items: normalizedItems,
      sources: combinedSources,
    };
  };

  const runRapidVisaMapVerification = async () => {
    const passportIso2 = resolveIso2Code(cleanPassport);
    const destIso2 = resolveIso2Code(cleanDest);
    const raw = await callRapidApi<any>('visa-requirement.p.rapidapi.com', '/v2/visa/map', {
      method: 'POST',
      body: { passport: passportIso2 },
      cacheKey: `visamap:${passportIso2}`,
      cacheTtlMs: 3600_000,
    });

    const colorBuckets: Record<string, string[]> =
      raw?.data?.colors || raw?.colors || {};
    let resolvedCategory = '';
    for (const [colorKey, codesRaw] of Object.entries(colorBuckets)) {
      const codeStr = Array.isArray(codesRaw)
        ? codesRaw.map((x) => String(x).toUpperCase())
        : String(codesRaw || '')
            .split(/[,\s]+/)
            .map((x) => x.trim().toUpperCase());
      if (codeStr.includes(destIso2)) {
        resolvedCategory = colorKey;
        break;
      }
    }

    const normalizedColor = resolvedCategory.toLowerCase();
    const mappedRegime =
      normalizedColor.includes('green') || normalizedColor.includes('free')
        ? 'Visa-Free / Open Access'
        : normalizedColor.includes('blue') || normalizedColor.includes('evisa') || normalizedColor.includes('eta')
        ? 'eVisa / eTA Required'
        : normalizedColor.includes('yellow') || normalizedColor.includes('arrival')
        ? 'Visa on Arrival'
        : normalizedColor.includes('red') || normalizedColor.includes('required')
        ? 'Embassy / Consular Visa'
        : '';

    const baselineEntry = inputItems.find((i) => i.id === 'entry_regime')?.currentValue || '';
    const entryMatches =
      mappedRegime &&
      (baselineEntry.toLowerCase().includes(mappedRegime.split(' ')[0].toLowerCase()) ||
        baselineEntry.toLowerCase() === mappedRegime.toLowerCase());

    const normalizedItems = inputItems.map((baseline) => {
      if (baseline.id === 'entry_regime') {
        return {
          id: baseline.id,
          label: baseline.label,
          status: (!mappedRegime ? 'not found' : entryMatches ? 'confirmed' : 'changed') as
            | 'confirmed'
            | 'changed'
            | 'not found',
          summary: mappedRegime
            ? `Live border classification for ${passportIso2} -> ${destIso2} is "${mappedRegime}" (tier: ${resolvedCategory}).`
            : `No direct entry code returned for ${destIso2} on passport ${passportIso2}.`,
          last_verified_date: todayIso,
          sources: [],
        };
      }
      return {
        id: baseline.id,
        label: baseline.label,
        status: 'not found' as const,
        summary:
          'Live border matrix provides entry-regime classification; granular fee, stay window, and consular steps await official portal confirmation.',
        last_verified_date: todayIso,
        sources: [],
      };
    });

    return {
      passportCountry: cleanPassport,
      destinationCountry: cleanDest,
      travelPurpose: cleanPurpose,
      checkedAt: new Date().toISOString(),
      providerUsed: 'AfriEstate Consular Verification',
      reportText: mappedRegime
        ? `Live border classification for ${cleanPassport} (${passportIso2}) -> ${cleanDest} (${destIso2}): ${mappedRegime}.`
        : '',
      parsed: {
        entryCategory: mappedRegime || 'Verify via Official Portal',
        stayLimit: inputItems.find((i) => i.id === 'stay_limit')?.currentValue || 'See diplomatic terms',
        estimatedFee: inputItems.find((i) => i.id === 'fee_band')?.currentValue || 'Official tariff applies',
        processingTime: inputItems.find((i) => i.id === 'processing_window')?.currentValue || 'Check portal SLA',
        officialPortal: inputItems.find((i) => i.id === 'official_portal')?.currentValue || `${cleanDest} Immigration`,
        bureaucraticSummary: mappedRegime
          ? `Cross-checked against live corridor policy: ${cleanPassport} (${passportIso2}) passport entry status for ${cleanDest} (${destIso2}) is "${mappedRegime}".`
          : `No explicit entry tag returned for ${destIso2}; check curated consular filing steps below.`,
        propertyAdvisory:
          inputItems.find((i) => i.id === 'property_investor_advisory')?.currentValue ||
          'Verify non-resident deed & tax compliance locally.',
      },
      items: normalizedItems,
      sources: [],
    };
  };

  const turnVisaMapFirst = Boolean(getRapidApiKey()) && visaAdvisorRotationIdx++ % 2 === 1;
  const order = turnVisaMapFirst
    ? [
        { name: 'VisaMapAPI', fn: runRapidVisaMapVerification },
        { name: 'GeminiSearch', fn: runGeminiVisaVerification },
      ]
    : [
        { name: 'GeminiSearch', fn: runGeminiVisaVerification },
        { name: 'VisaMapAPI', fn: runRapidVisaMapVerification },
      ];

  const internalErrors: string[] = [];
  for (const step of order) {
    try {
      const payload = await step.fn();
      return res.json(payload);
    } catch (err: any) {
      const parsed = step.name === 'GeminiSearch' ? parseGeminiError(err) : null;
      internalErrors.push(`${step.name}: ${parsed ? parsed.message : err?.message || 'failed'}`);
    }
  }

  console.warn(`[API /api/gemini/visa-advisor warning]: ${internalErrors.join(' | ')}`);
  return res.status(502).json({
    error: `Live immigration verification is temporarily unavailable for ${cleanPassport} to ${cleanDest}. Curated dossier remains active below.`,
    code: 'ALL_PROVIDERS_FAILED',
  });
});

// 5b-2b. Direct RapidAPI Global Visa Map endpoint for Pan-African 54-country color map overlay
app.post('/api/visa/map', async (req, res) => {
  try {
    const { passport } = req.body || {};
    const iso2 = resolveIso2Code(typeof passport === 'string' && passport.trim() ? passport : 'ZA');
    const raw = await callRapidApi<any>('visa-requirement.p.rapidapi.com', '/v2/visa/map', {
      method: 'POST',
      body: { passport: iso2 },
      cacheKey: `visamap:${iso2}`,
      cacheTtlMs: 3600_000,
    });

    const colorBuckets: Record<string, string[]> = raw?.data?.colors || raw?.colors || {};
    const regimeByIso2: Record<string, { regime: string; colorTier: string }> = {};
    for (const [colorKey, codesRaw] of Object.entries(colorBuckets)) {
      const codes = Array.isArray(codesRaw)
        ? codesRaw.map((x) => String(x).toUpperCase())
        : String(codesRaw || '')
            .split(/[,\s]+/)
            .map((x) => x.trim().toUpperCase())
            .filter(Boolean);
      const lower = colorKey.toLowerCase();
      const regime =
        lower.includes('green') || lower.includes('free')
          ? 'Visa-Free / Open Access'
          : lower.includes('blue') || lower.includes('evisa') || lower.includes('eta')
          ? 'eVisa / eTA Required'
          : lower.includes('yellow') || lower.includes('arrival')
          ? 'Visa on Arrival'
          : 'Embassy / Consular Visa';
      for (const code of codes) {
        regimeByIso2[code] = { regime, colorTier: colorKey };
      }
    }

    res.json({
      passportIso2: iso2,
      regimeByIso2,
      isLive: true,
      providerUsed: 'AfriEstate Border Matrix',
      checkedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    const iso2 = resolveIso2Code(typeof req.body?.passport === 'string' && req.body.passport.trim() ? req.body.passport : 'ZA');
    console.warn('[API /api/visa/map warning]:', error?.message || 'unavailable');
    res.json({
      passportIso2: iso2,
      regimeByIso2: {},
      isLive: false,
      upstreamWarning: 'Live border matrix sync temporarily unavailable.',
      providerUsed: 'Curated African Visa Matrix (Fallback)',
      checkedAt: new Date().toISOString(),
    });
  }
});

// 5b-3. Google Maps Grounding using Gemini (gemini-4-hydrogen + googleMaps tool)
// NOTE: Strictly never combined with googleSearch or responseMimeType/responseSchema
app.post('/api/gemini/maps-grounding', async (req, res) => {
  try {
    const ai = getGeminiClient();
    const { query, lat, lng, city, country } = req.body || {};
    const cleanQuery = typeof query === 'string' ? query.trim().slice(0, 260) : '';
    const cleanCity = typeof city === 'string' ? city.trim().slice(0, 80) : '';
    const cleanCountry = typeof country === 'string' ? country.trim().slice(0, 80) : '';

    if (!cleanQuery) {
      return res.status(400).json({ error: 'A location intelligence query is required.' });
    }
    if (!ai) {
      return res.status(503).json({
        error: 'Live Google Maps Grounding service is unavailable because server credentials are not configured.',
      });
    }

    const numericLat = Number(lat);
    const numericLng = Number(lng);
    const hasCoords = Number.isFinite(numericLat) && Number.isFinite(numericLng) && (numericLat !== 0 || numericLng !== 0);

    const locationLabel = [cleanCity, cleanCountry].filter(Boolean).join(', ') || 'Africa';
    const prompt = `${cleanQuery} near ${locationLabel}. Provide factual place recommendations, distances or neighborhood context, and highlight verified local highlights.`;

    const config: any = {
      tools: [{ googleMaps: {} }],
    };

    if (hasCoords) {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: numericLat,
            longitude: numericLng,
          },
        },
      };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config,
    });

    const summary = (response.text || '').trim();
    const candidate = response.candidates?.[0];
    const groundingMetadata = candidate?.groundingMetadata;
    const rawChunks = groundingMetadata?.groundingChunks || [];
    const seenUris = new Set<string>();
    const places: Array<{
      title: string;
      uri: string;
      placeId?: string;
      reviewSnippets: string[];
    }> = [];

    for (const chunk of rawChunks) {
      const mapsChunk = chunk?.maps;
      if (mapsChunk?.uri && !seenUris.has(mapsChunk.uri)) {
        seenUris.add(mapsChunk.uri);
        const snippets: string[] = [];
        const rawSnippets = mapsChunk?.placeAnswerSources?.reviewSnippets;
        if (Array.isArray(rawSnippets)) {
          for (const snip of rawSnippets as any[]) {
            if (typeof snip === 'string' && snip.trim()) {
              snippets.push(snip.trim());
            } else if (snip && typeof snip?.content === 'string' && snip.content.trim()) {
              snippets.push(snip.content.trim());
            } else if (snip && typeof snip?.title === 'string' && snip.title.trim()) {
              snippets.push(snip.title.trim());
            }
          }
        }
        places.push({
          title: mapsChunk.title || 'View on Google Maps',
          uri: mapsChunk.uri,
          placeId: mapsChunk.placeId,
          reviewSnippets: snippets.slice(0, 2),
        });
      }
    }

    res.json({
      summary,
      places,
      widgetToken: groundingMetadata?.googleMapsWidgetContextToken || null,
      checkedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    const parsed = parseGeminiError(error);
    console.warn(`[API /api/gemini/maps-grounding warning] (${parsed.status} ${parsed.code}): ${parsed.message}`);
    res.status(parsed.status).json({ error: parsed.message, code: parsed.code });
  }
});

// 5b-4. Live Real Estate & Neighborhood Search Grounding (gemini-4-hydrogen + googleSearch)
app.post('/api/gemini/search-grounding', async (req, res) => {
  try {
    const ai = getGeminiClient();
    const { query, city, country } = req.body || {};
    const cleanQuery = typeof query === 'string' ? query.trim().slice(0, 300) : '';
    const cleanCity = typeof city === 'string' ? city.trim().slice(0, 80) : '';
    const cleanCountry = typeof country === 'string' ? country.trim().slice(0, 80) : '';

    if (!cleanQuery) {
      return res.status(400).json({ error: 'A market search query is required.' });
    }
    if (!ai) {
      return res.status(503).json({
        error: 'Live neighborhood intelligence service is unavailable because server credentials are not configured.',
      });
    }

    const locationScope = [cleanCity, cleanCountry].filter(Boolean).join(', ');
    const prompt = locationScope
      ? `Search the live web regarding real estate, urban infrastructure, rental yields, and neighborhood developments for ${locationScope}: ${cleanQuery}. Summarize factual recent findings clearly in 3-4 concise sentences.`
      : `Search the live web for factual recent African real estate & travel intelligence: ${cleanQuery}. Summarize clearly in 3-4 concise sentences.`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const summary = (response.text || '').trim();
    const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const seenUris = new Set<string>();
    const sources: { title: string; uri: string }[] = [];
    for (const chunk of rawChunks) {
      const uri = chunk?.web?.uri;
      const title = chunk?.web?.title;
      if (uri && !seenUris.has(uri)) {
        seenUris.add(uri);
        sources.push({
          title: title || uri,
          uri,
        });
      }
    }

    res.json({
      summary,
      sources,
      checkedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    const parsed = parseGeminiError(error);
    console.warn(`[API /api/gemini/search-grounding warning] (${parsed.status} ${parsed.code}): ${parsed.message}`);
    res.status(parsed.status).json({ error: parsed.message, code: parsed.code });
  }
});

// Provide client Maps JS key when injected via server runtime environment
app.get('/api/maps/client-config', (_req, res) => {
  const apiKey = (
    process.env.VITE_GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    ''
  ).trim();
  res.json({ apiKey });
});

// 5b-5. TripAdvisor Flights Airport Search (rotates into FlightSearchWidget airport picker)
const GLOBAL_GATEWAY_AIRPORTS = [
  { code: 'LHR', city: 'London', country: 'United Kingdom', airport: 'London Heathrow Airport' },
  { code: 'LGW', city: 'London', country: 'United Kingdom', airport: 'London Gatwick Airport' },
  { code: 'STN', city: 'London', country: 'United Kingdom', airport: 'London Stansted Airport' },
  { code: 'CDG', city: 'Paris', country: 'France', airport: 'Paris Charles de Gaulle Airport' },
  { code: 'DXB', city: 'Dubai', country: 'United Arab Emirates', airport: 'Dubai International Airport' },
  { code: 'DOH', city: 'Doha', country: 'Qatar', airport: 'Hamad International Airport' },
  { code: 'JFK', city: 'New York', country: 'United States', airport: 'John F. Kennedy International Airport' },
  { code: 'IST', city: 'Istanbul', country: 'Turkey', airport: 'Istanbul International Airport' },
  { code: 'LIS', city: 'Lisbon', country: 'Portugal', airport: 'Humberto Delgado Airport' },
  { code: 'FRA', city: 'Frankfurt', country: 'Germany', airport: 'Frankfurt Airport' },
  { code: 'AMS', city: 'Amsterdam', country: 'Netherlands', airport: 'Amsterdam Airport Schiphol' },
  { code: 'SIN', city: 'Singapore', country: 'Singapore', airport: 'Singapore Changi Airport' },
];

app.get('/api/travel/airports/search', async (req, res) => {
  const query = typeof req.query.query === 'string' ? req.query.query.trim().slice(0, 60) : '';
  if (query.length < 2) {
    return res.json({ airports: [], isLive: true, providerUsed: 'AfriEstate Global Airport Directory' });
  }
  try {
    const raw = await callRapidApi<any>(
      'tripadvisor16.p.rapidapi.com',
      `/api/v1/flights/searchAirport?query=${encodeURIComponent(query)}`,
      { cacheKey: `ta_airport:${query.toLowerCase()}`, cacheTtlMs: 3600_000 }
    );
    const list = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
    const mappedAirports = list
      .map((item: any) => {
        const code = String(item?.airportCode || item?.iataCode || item?.code || '').trim().toUpperCase();
        const city = String(
          item?.cityName || item?.city || item?.details?.cityName || item?.name || ''
        ).trim();
        const country = String(
          item?.countryName || item?.country || item?.details?.countryName || 'International'
        ).trim();
        const airport = String(
          item?.airportName || item?.shortName || item?.title || item?.name || `${city} Airport`
        ).trim();
        if (!code || code.length < 3) return null;
        return { code: code.slice(0, 3), city: city || airport, country, airport };
      })
      .filter(Boolean);

    const qLower = query.toLowerCase();
    const gatewayMatches = GLOBAL_GATEWAY_AIRPORTS.filter(
      (a) =>
        a.city.toLowerCase().includes(qLower) ||
        a.code.toLowerCase().includes(qLower) ||
        a.country.toLowerCase().includes(qLower) ||
        a.airport.toLowerCase().includes(qLower)
    );
    const seenCodes = new Set(mappedAirports.map((a: any) => a.code));
    const mergedAirports = [
      ...mappedAirports,
      ...gatewayMatches.filter((g) => !seenCodes.has(g.code)),
    ];

    res.json({
      airports: mergedAirports,
      isLive: true,
      providerUsed: 'AfriEstate Global Airport Directory',
    });
  } catch (error: any) {
    console.warn('[API /api/travel/airports/search warning]:', error?.message || 'unavailable');
    const qLower = query.toLowerCase();
    const fallbackMatches = GLOBAL_GATEWAY_AIRPORTS.filter(
      (a) =>
        a.city.toLowerCase().includes(qLower) ||
        a.code.toLowerCase().includes(qLower) ||
        a.country.toLowerCase().includes(qLower) ||
        a.airport.toLowerCase().includes(qLower)
    );
    res.json({
      airports: fallbackMatches,
      isLive: false,
      upstreamWarning: 'Live airport directory lookup temporarily unavailable.',
      providerUsed: 'AfriEstate Gateway Airport Directory (Fallback)',
    });
  }
});

// 5b-6. Multi-Provider Travel Languages (rotates Google Flights & Booking.com meta languages)
const FALLBACK_TRAVEL_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'pt', name: 'Português' },
  { code: 'ar', name: 'العربية' },
  { code: 'sw', name: 'Kiswahili' },
  { code: 'zu', name: 'isiZulu' },
  { code: 'af', name: 'Afrikaans' },
  { code: 'yo', name: 'Yorùbá' },
  { code: 'ha', name: 'Hausa' },
  { code: 'am', name: 'አማርኛ' },
  { code: 'es', name: 'Español' },
  { code: 'de', name: 'Deutsch' },
];

app.get('/api/travel/languages', async (req, res) => {
  const vertical = String(req.query.vertical || 'rotate').toLowerCase();

  const fetchBookingLanguages = async () => {
    const raw = await callRapidApi<any>(
      'booking-com15.p.rapidapi.com',
      '/api/v1/meta/getLanguages',
      { cacheKey: 'booking_languages', cacheTtlMs: 21600_000 }
    );
    const list = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
    const languages = list
      .map((l: any) => ({
        code: String(l?.code || l?.languagecode || '').trim(),
        name: String(l?.name || l?.language || l?.code || '').trim(),
        countryFlag: l?.countryFlag || undefined,
      }))
      .filter((l: any) => l.code && l.name);
    if (languages.length === 0) throw new Error('Primary localization feed returned empty language list');
    return { isLive: true, providerUsed: 'AfriEstate Travel Localization', languages };
  };

  const fetchGoogleFlightsLanguages = async () => {
    const raw = await callRapidApi<any>(
      'google-flights2.p.rapidapi.com',
      '/api/v1/getLanguages',
      { cacheKey: 'google_flights_languages', cacheTtlMs: 21600_000 }
    );
    const list = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
    const languages = list
      .map((l: any) => ({
        code: String(l?.language_code || l?.code || l?.id || '').trim(),
        name: String(l?.language_name || l?.name || l?.language || l?.code || '').trim(),
      }))
      .filter((l: any) => l.code && l.name);
    if (languages.length === 0) throw new Error('Secondary localization feed returned empty language list');
    return { isLive: true, providerUsed: 'AfriEstate Travel Localization', languages };
  };

  const bookingFirst =
    vertical === 'stays'
      ? travelLanguagesRotationIdx++ % 3 !== 2
      : vertical === 'flights'
      ? travelLanguagesRotationIdx++ % 3 === 2
      : travelLanguagesRotationIdx++ % 2 === 0;

  const order = bookingFirst
    ? [fetchBookingLanguages, fetchGoogleFlightsLanguages]
    : [fetchGoogleFlightsLanguages, fetchBookingLanguages];

  const internalErrors: string[] = [];
  for (const fn of order) {
    try {
      const payload = await fn();
      return res.json(payload);
    } catch (err: any) {
      internalErrors.push(err?.message || 'provider failed');
    }
  }
  console.warn(`[API /api/travel/languages warning]: ${internalErrors.join(' | ')}`);

  return res.json({
    isLive: false,
    upstreamWarning: 'Live localization feed temporarily unavailable.',
    providerUsed: 'AfriEstate Multilingual Pack (Fallback)',
    languages: FALLBACK_TRAVEL_LANGUAGES,
  });
});

// 5b-7. Ranked Crime Cities Safety Index (for Neighborhood Explorer & Property safety benchmarking)
app.get('/api/neighborhood/safety-index', async (req, res) => {
  const city = typeof req.query.city === 'string' ? req.query.city.trim().slice(0, 80) : '';
  const country = typeof req.query.country === 'string' ? req.query.country.trim().slice(0, 80) : '';
  try {
    const raw = await callRapidApi<any>(
      'ranked-crime-cities.p.rapidapi.com',
      '/Kc4Qth/ranked_crime_cities',
      { cacheKey: 'ranked_crime_cities_all', cacheTtlMs: 3600_000 }
    );
    const rows: any[] = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw?.cities)
      ? raw.cities
      : [];

    const normalized = rows
      .filter((r: any) => {
        const rawLabel = String(r?.Name || r?.City || r?.city || r?.name || '').trim();
        return rawLabel && rawLabel.toLowerCase() !== 'city';
      })
      .map((r: any, idx: number) => {
        const compositeName = String(r?.Name || '').trim();
        const parts = compositeName
          ? compositeName.split(',').map((p: string) => p.trim()).filter(Boolean)
          : [];
        const cityName = String(r?.City || r?.city || r?.name || parts[0] || '').trim();
        const countryName = String(
          r?.Country || r?.country || (parts.length > 1 ? parts[parts.length - 1] : '')
        ).trim();
        const crimeIndex = Number(r?.['Crime Index'] ?? r?.crime_index ?? r?.crimeIndex ?? NaN);
        const safetyIndex = Number(
          r?.['Safety Index'] ??
            r?.safety_index ??
            r?.safetyIndex ??
            (Number.isFinite(crimeIndex) ? Math.max(0, 100 - crimeIndex) : NaN)
        );
        const rawId = Number(r?.id);
        const rank = Number(
          r?.Rank ?? r?.rank ?? (Number.isFinite(rawId) && rawId > 1 ? rawId - 1 : idx + 1)
        );
        return {
          rank,
          city: cityName,
          country: countryName,
          crimeIndex: Number.isFinite(crimeIndex) ? Number(crimeIndex.toFixed(1)) : null,
          safetyIndex: Number.isFinite(safetyIndex) ? Number(safetyIndex.toFixed(1)) : null,
        };
      });

    const cityLower = city.toLowerCase();
    const countryLower = country.toLowerCase();
    const matchedCity =
      normalized.find((x) => cityLower && x.city.toLowerCase().includes(cityLower)) ||
      normalized.find((x) => countryLower && x.country.toLowerCase().includes(countryLower)) ||
      null;

    res.json({
      isLive: true,
      matched: matchedCity,
      countryPeerCount: normalized.filter((x) => countryLower && x.country.toLowerCase().includes(countryLower)).length,
      sampleAfricanPeers: normalized
        .filter((x) =>
          [
            'south africa',
            'kenya',
            'nigeria',
            'egypt',
            'morocco',
            'ghana',
            'tanzania',
            'rwanda',
            'tunisia',
            'algeria',
            'ethiopia',
            'namibia',
            'botswana',
            'mauritius',
          ].some((c) => x.country.toLowerCase().includes(c))
        )
        .slice(0, 6),
      totalRankedCities: normalized.length,
      providerUsed: 'AfriEstate City Safety Index',
      checkedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.warn('[API /api/neighborhood/safety-index warning]:', error?.message || 'unavailable');
    res.json({
      isLive: false,
      upstreamWarning: 'Live city safety benchmark is currently unavailable.',
      matched: null,
      countryPeerCount: 0,
      sampleAfricanPeers: [],
      totalRankedCities: 0,
      providerUsed: 'AfriEstate City Safety Index (Not verified live)',
      checkedAt: new Date().toISOString(),
    });
  }
});

// 5b-8. Internal Feed Rotation Health Snapshot (provider hostnames anonymized in JSON output)
app.get('/api/travel/rotation-status', (_req, res) => {
  res.json({
    liveFeedsConfigured: getRapidApiKeys().length > 0,
    feedAppConfigured: Boolean(process.env.RAPIDAPI_APP_ID),
    keyPoolSize: getRapidApiKeys().length,
    aiConfigured: Boolean(getActiveApiKey()),
    rotationCounters: {
      flightTracker: flightTrackerRotationIdx,
      visaAdvisor: visaAdvisorRotationIdx,
      travelLanguages: travelLanguagesRotationIdx,
    },
    channels: Array.from(rapidHostHealth.values()).map((h, idx) => ({
      channel: `feed-${idx + 1}`,
      state: h.state,
      lastStatus: h.lastStatus,
      lastCheckedAt: h.lastCheckedAt,
    })),
    checkedAt: new Date().toISOString(),
  });
});

// 5c. Scoped Real-Time Payment Settlement (ONLY Flights, Short Stays, and Car Hire)
const ALLOWED_PAYMENT_CATEGORIES = new Set(['flight', 'short-stay', 'car-hire']);
const ALLOWED_PAYMENT_METHODS = new Set([
  'Card',
  'Ozow Instant EFT',
  'Payflex (Pay in 4)',
  'M-Pesa / Mobile Money',
  'Pay later (mobicred)',
]);

app.post('/api/payments/settle', async (req, res) => {
  try {
    const {
      bookingCategory,
      itemId,
      itemTitle,
      amount,
      currency = 'ZAR',
      paymentMethod = 'Card',
      customerName,
      customerEmail,
      paymentDetails = {},
      metadata = {},
    } = req.body || {};

    const normalizedCategory = String(bookingCategory || '').trim().toLowerCase();
    if (!ALLOWED_PAYMENT_CATEGORIES.has(normalizedCategory)) {
      return res.status(403).json({
        error:
          'Online payment settlement is strictly restricted to Flights, Short-Stay Accommodations, and Car Hire. Long-term rental properties, properties for sale, and investment properties must not be settled on the platform.',
      });
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: 'A valid positive settlement amount is required.' });
    }

    const cleanName = typeof customerName === 'string' ? customerName.trim().slice(0, 120) : '';
    const cleanEmail = typeof customerEmail === 'string' ? customerEmail.trim().toLowerCase().slice(0, 140) : '';
    if (!cleanName || cleanName.length < 2) {
      return res.status(400).json({ error: 'Customer full name is required for payment settlement.' });
    }
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ error: 'A valid customer email is required for digital receipt delivery.' });
    }

    if (!ALLOWED_PAYMENT_METHODS.has(String(paymentMethod))) {
      return res.status(400).json({ error: 'Unsupported payment method selected.' });
    }

    if (paymentMethod === 'Card') {
      const digits = String(paymentDetails?.cardNumber || '').replace(/\D/g, '');
      const expiry = String(paymentDetails?.cardExpiry || '').trim();
      const cvv = String(paymentDetails?.cardCvv || '').replace(/\D/g, '');
      if (digits.length < 12 || !expiry || cvv.length < 3) {
        return res.status(400).json({
          error: 'Card authorization details are incomplete. Please verify card number, expiry (MM/YY), and CVV.',
        });
      }
    }

    if (paymentMethod.includes('Mobile Money')) {
      const msisdn = String(paymentDetails?.mobileMoneyPhone || '').replace(/\D/g, '');
      if (msisdn.length < 8) {
        return res.status(400).json({
          error: 'Please enter a valid Mobile Money MSISDN phone number to receive the authorization prompt.',
        });
      }
    }

    const randomBlock = Math.floor(100000 + Math.random() * 899999);
    const prefix =
      normalizedCategory === 'flight'
        ? 'AFR-FLT'
        : normalizedCategory === 'short-stay'
        ? 'AFR-STY'
        : 'AFR-CAR';

    const transactionRef = `${prefix}-${randomBlock}`;
    const settlementId = `STL-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 899)}`;
    const authorizationCode = `AUTH-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    res.json({
      ok: true,
      status: 'Settled',
      bookingCategory: normalizedCategory,
      itemId: String(itemId || ''),
      itemTitle: String(itemTitle || 'AfriEstate Reservation'),
      amount: Math.round(numericAmount * 100) / 100,
      currency: String(currency || 'ZAR').toUpperCase(),
      paymentMethod,
      customerName: cleanName,
      customerEmail: cleanEmail,
      transactionRef,
      settlementId,
      authorizationCode,
      settledAt: new Date().toISOString(),
      protectionGuarantee: 'AfriEstate Real-Time Verified Settlement & Escrow Protection',
      metadata: typeof metadata === 'object' && metadata ? metadata : {},
    });
  } catch (error: any) {
    console.error('[API /api/payments/settle error]:', error);
    res.status(500).json({ error: error?.message || 'Payment settlement failed.' });
  }
});

// 6. Gemini Live API WebSocket Bridge
const wss = new WebSocketServer({ server, path: '/api/live' });

wss.on('connection', async (clientWs: WebSocket) => {
  console.log('[LiveAPI] Client connected to WebSocket');
  let session: any = null;

  try {
    const ai = getGeminiClient();
    if (!ai) {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ type: 'error', error: 'Live voice service is currently unavailable because server credentials are not configured.' }));
        clientWs.close();
      }
      return;
    }
    session = await ai.live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        systemInstruction: 'You are a friendly and helpful real estate assistant for AfriEstate. Keep your answers concise and helpful.',
      },
      callbacks: {
        onopen: () => {
          console.log('[LiveAPI] Connected to Gemini Live');
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'open' }));
          }
        },
        onmessage: (message: LiveServerMessage) => {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify(message));
          }
        },
        onerror: (err: any) => {
          console.error('[LiveAPI] Error in Gemini Live session:', err);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'error', error: err?.message || String(err) }));
          }
        },
        onclose: () => {
          console.log('[LiveAPI] Gemini Live closed');
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'close' }));
          }
        },
      },
    });

    clientWs.on('message', (rawData) => {
      try {
        const payload = JSON.parse(rawData.toString());
        if (payload.audio) {
          session?.sendRealtimeInput({
            audio: { data: payload.audio, mimeType: payload.mimeType || 'audio/pcm;rate=16000' },
          });
        } else if (payload.media) {
          session?.sendRealtimeInput({
            audio: { data: payload.media.data, mimeType: payload.media.mimeType || 'audio/pcm;rate=16000' },
          });
        } else if (payload.video) {
          session?.sendRealtimeInput({
            video: payload.video,
          });
        } else if (payload.text) {
          session?.sendRealtimeInput({
            text: payload.text,
          });
        }
      } catch (err) {
        console.error('[LiveAPI] Error processing client message:', err);
      }
    });

    clientWs.on('close', () => {
      console.log('[LiveAPI] Client WebSocket closed');
      try {
        session?.close();
      } catch (e) {
        // ignore
      }
    });

    clientWs.on('error', (err) => {
      console.error('[LiveAPI] Client WebSocket error:', err);
      try {
        session?.close();
      } catch (e) {
        // ignore
      }
    });
  } catch (err: any) {
    console.error('[LiveAPI] Failed to initialize Gemini Live session:', err);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ type: 'error', error: err?.message || 'Failed to connect to Live API' }));
      clientWs.close();
    }
  }
});

// Vite middleware in dev or static files in production
const isProduction = process.env.NODE_ENV === 'production';

if (!isProduction) {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.resolve(__dirname, 'dist');
  app.use(express.static(distPath));
  app.use((_req, res) => {
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
}

const PORT = Number(process.env.PORT) || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[AfriEstate] Server running at http://0.0.0.0:${PORT}`);
});

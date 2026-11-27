import express from 'express';
import crypto from 'crypto';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, LiveServerMessage, Modality, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load optional gitignored .env.local fallbacks without overriding Secrets-area env vars
(() => {
  try {
    const existingEnvKeys = Object.keys(process.env).filter((k) => Boolean((process.env[k] || '').trim()));
    const hasSecretRapidKeys = existingEnvKeys.some((k) =>
      /RAPID_?API.*KEY/i.test(k) && !/APP_ID/i.test(k)
    );
    const hasSecretGeminiKeys = existingEnvKeys.some((k) =>
      /GEMINI.*(?:API_?)?KEY/i.test(k) ||
      /^GOOGLE_(?:AI|API|GENAI).*KEY/i.test(k) ||
      /^GENAI.*KEY/i.test(k) ||
      /^(?:ROTATED_)?API_KEYS?(?:_.*)?$/i.test(k)
    );
    const hasSecretMapsKeys = existingEnvKeys.some((k) =>
      /GOOGLE_MAPS.*KEY/i.test(k) || /^(?:MAPS|GMP)_.*KEY/i.test(k)
    );
    const hasSecretWeb3Rpc = existingEnvKeys.some((k) =>
      /^(?:ALCHEMY|ETH(?:EREUM)?|EVM|WEB3|BLOCKCHAIN|JSON_?RPC|RPC).*(?:KEY|URL)/i.test(k)
    );
    const hasSecretMailerLite = existingEnvKeys.some((k) => /^MAILERLITE/i.test(k));
    const hasSecretTwilio = existingEnvKeys.some((k) => /^TWILIO/i.test(k));
    const hasSecretMeetingBaas = existingEnvKeys.some((k) => /^MEETING_?BAAS/i.test(k));
    const hasSecretPwPush = existingEnvKeys.some((k) => /^PWPUSH/i.test(k));
    const hasSecretOpenRouter = existingEnvKeys.some((k) => /^OPENROUTER/i.test(k));
    const hasSecretAltAi = existingEnvKeys.some((k) =>
      /^(?:AI_APIS?|AI_API_KEYS?|ALT_AI|OPENAI|GROQ|TOGETHER|AIML|DEEPSEEK|MISTRAL|AUTHENTICATION_KEY|AI_AUTH_KEY)/i.test(k)
    );

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
        if (!key || !val) continue;
        if ((process.env[key] || '').trim()) continue;
        if (hasSecretRapidKeys && /RAPID_?API.*KEY/i.test(key)) continue;
        if (
          hasSecretGeminiKeys &&
          (/GEMINI.*(?:API_?)?KEY/i.test(key) ||
            /^GOOGLE_(?:AI|API|GENAI).*KEY/i.test(key) ||
            /^API_KEYS?(?:_.*)?$/i.test(key))
        ) {
          continue;
        }
        if (hasSecretMapsKeys && (/GOOGLE_MAPS.*KEY/i.test(key) || /^(?:MAPS|GMP)_.*KEY/i.test(key))) continue;
        if (hasSecretWeb3Rpc && /^(?:ALCHEMY|ETH(?:EREUM)?|EVM|WEB3|BLOCKCHAIN|JSON_?RPC|RPC).*(?:KEY|URL)/i.test(key)) continue;
        if (hasSecretMailerLite && /^MAILERLITE/i.test(key)) continue;
        if (hasSecretTwilio && /^TWILIO/i.test(key)) continue;
        if (hasSecretMeetingBaas && /^MEETING_?BAAS/i.test(key)) continue;
        if (hasSecretPwPush && /^PWPUSH/i.test(key)) continue;
        if (hasSecretOpenRouter && /^OPENROUTER/i.test(key)) continue;
        if (hasSecretAltAi && /^(?:AI_APIS?|AI_API_KEYS?|ALT_AI|OPENAI|GROQ|TOGETHER|AIML|DEEPSEEK|MISTRAL|AUTHENTICATION_KEY|AI_AUTH_KEY)/i.test(key)) continue;
        process.env[key] = val;
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

// Sliding-window per-IP rate limiter for AI, travel, visa, neighborhood, and payment endpoints
const apiRateBuckets = new Map<string, number[]>();
const API_WINDOW_MS = 60_000;

function createRateLimiter(scope: string, maxRequests: number) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown';
    const bucketKey = `${scope}:${clientIp}`;
    const now = Date.now();
    const timestamps = (apiRateBuckets.get(bucketKey) || []).filter((ts) => now - ts < API_WINDOW_MS);
    if (timestamps.length >= maxRequests) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please wait a moment before retrying.' });
    }
    timestamps.push(now);
    apiRateBuckets.set(bucketKey, timestamps);
    if (apiRateBuckets.size > 5000) {
      for (const [key, list] of apiRateBuckets.entries()) {
        if (list.every((ts) => now - ts >= API_WINDOW_MS)) {
          apiRateBuckets.delete(key);
        }
      }
    }
    next();
  };
}

app.use('/api/gemini', createRateLimiter('gemini', 90));
app.use('/api/ai', createRateLimiter('ai', 90));
app.use('/api/payments', createRateLimiter('payments', 30));
app.use('/api/visa', createRateLimiter('visa', 90));
app.use('/api/travel', createRateLimiter('travel', 120));
app.use('/api/neighborhood', createRateLimiter('neighborhood', 120));
app.use('/api/web3', createRateLimiter('web3', 90));
app.use('/api/integrations', createRateLimiter('integrations', 60));

// Enable JSON parsing with large body support for image/video base64 frames
app.use(express.json({ limit: '25mb' }));

// --- Secret-Area Key Pool & Automatic Round-Robin Rotation Engine ---
function parseSecretKeyList(rawValue: string | undefined): string[] {
  if (!rawValue) return [];
  return rawValue
    .split(/[\r\n,;]+/)
    .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
}

function collectSecretKeyPool(patterns: RegExp[], excludePatterns: RegExp[] = []): string[] {
  const seen = new Set<string>();
  const collected: string[] = [];
  const matchingNames = Object.keys(process.env)
    .filter((envName) => {
      if (excludePatterns.some((rx) => rx.test(envName))) return false;
      return patterns.some((rx) => rx.test(envName));
    })
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  for (const envName of matchingNames) {
    for (const token of parseSecretKeyList(process.env[envName])) {
      if (!seen.has(token)) {
        seen.add(token);
        collected.push(token);
      }
    }
  }
  return collected;
}

const keyCooldownUntil = new Map<string, number>();

function getKeyFingerprint(scope: string, key: string): string {
  return `${scope}:${crypto.createHash('sha256').update(key).digest('hex').slice(0, 16)}`;
}

function isKeyCoolingDown(scope: string, key: string): boolean {
  const fp = getKeyFingerprint(scope, key);
  const until = keyCooldownUntil.get(fp) || 0;
  if (until > Date.now()) return true;
  if (until > 0) keyCooldownUntil.delete(fp);
  return false;
}

function markKeyCooldown(scope: string, key: string, durationMs: number) {
  keyCooldownUntil.set(getKeyFingerprint(scope, key), Date.now() + durationMs);
}

const geminiKeyCursor = { idx: 0 };
const geminiUrlCursor = { idx: 0 };
const rapidKeyCursor = { idx: 0 };
const mapsKeyCursor = { idx: 0 };
const web3RpcCursor = { idx: 0 };
const mailerLiteKeyCursor = { idx: 0 };
const twilioKeyCursor = { idx: 0 };
const meetingBaasKeyCursor = { idx: 0 };
const pwPushUrlCursor = { idx: 0 };
const openRouterKeyCursor = { idx: 0 };
const alternativeAiKeyCursor = { idx: 0 };
let flightTrackerRotationIdx = 0;
let visaAdvisorRotationIdx = 0;
let travelLanguagesRotationIdx = 0;
let web3RpcRotationCount = 0;
let mailerLiteRotationCount = 0;
let twilioRotationCount = 0;
let meetingBaasRotationCount = 0;
let pwPushRotationCount = 0;
let openRouterRotationCount = 0;
let alternativeAiRotationCount = 0;

function isSafeHttpsUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '::1' ||
      host === '0.0.0.0' ||
      host.endsWith('.local') ||
      host.endsWith('.internal') ||
      /^127\./.test(host) ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^169\.254\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function getRotatedCandidates(scope: string, keys: string[], cursor: { idx: number }): string[] {
  if (keys.length === 0) return [];
  const start = cursor.idx % keys.length;
  cursor.idx = (cursor.idx + 1) % keys.length;
  const rotated = [...keys.slice(start), ...keys.slice(0, start)];
  const healthy = rotated.filter((k) => !isKeyCoolingDown(scope, k));
  const cooling = rotated.filter((k) => isKeyCoolingDown(scope, k));
  return healthy.length > 0 ? [...healthy, ...cooling] : rotated;
}

function getGeminiApiKeys(): string[] {
  return collectSecretKeyPool(
    [
      /GEMINI.*(?:API_?)?KEYS?(?:_.*)?$/i,
      /^GOOGLE_AI.*KEYS?(?:_.*)?$/i,
      /^GOOGLE_API_KEYS?(?:_.*)?$/i,
      /^GENAI.*KEYS?(?:_.*)?$/i,
      /^(?:ROTATED_)?API_KEYS?(?:_.*)?$/i,
    ],
    [/URL/i, /BASE_URL/i, /ENDPOINT/i, /OPENROUTER/i, /OPENAI/i, /AUTH/i]
  ).filter((token) => !/^https?:\/\//i.test(token) && !/^sk-/i.test(token));
}

function getGeminiBaseUrls(): string[] {
  return collectSecretKeyPool([
    /^(?:GEMINI|GOOGLE_AI|GENAI).*(?:BASE_?)?URLS?(?:_.*)?$/i,
  ]).filter((u) => isSafeHttpsUrl(u));
}

function getActiveApiKey(): string {
  const candidates = getRotatedCandidates('gemini', getGeminiApiKeys(), geminiKeyCursor);
  return candidates[0] || '';
}

function getOpenRouterApiKeys(): string[] {
  const direct = collectSecretKeyPool(
    [/^OPENROUTER(?:_API)?_KEYS?(?:_.*)?$/i],
    [/URL/i, /MODEL/i]
  ).filter((token) => !/^https?:\/\//i.test(token));
  const sharedOrTokens = collectSecretKeyPool(
    [/^AI_APIS?(?:_KEYS?)?(?:_.*)?$/i, /^ALT(?:ERNATIVE)?_AI_KEYS?(?:_.*)?$/i],
    [/URL/i, /MODEL/i, /AUTH/i]
  ).filter((token) => /^sk-or-/i.test(token));
  return Array.from(new Set([...direct, ...sharedOrTokens]));
}

function getOpenRouterBaseUrls(): string[] {
  const configured = collectSecretKeyPool([
    /^OPENROUTER(?:_API)?_(?:BASE_?)?URLS?(?:_.*)?$/i,
  ]).filter((u) => isSafeHttpsUrl(u));
  return configured.length > 0 ? configured : ['https://openrouter.ai/api/v1'];
}

function getAlternativeAiApiKeys(): string[] {
  return collectSecretKeyPool(
    [
      /^AI_APIS?(?:_KEYS?)?(?:_.*)?$/i,
      /^ALT(?:ERNATIVE)?_AI(?:_API)?_KEYS?(?:_.*)?$/i,
      /^OPENAI(?:_API)?_KEYS?(?:_.*)?$/i,
      /^GROQ(?:_API)?_KEYS?(?:_.*)?$/i,
      /^TOGETHER(?:_API)?_KEYS?(?:_.*)?$/i,
      /^AIML(?:_API)?_KEYS?(?:_.*)?$/i,
      /^DEEPSEEK(?:_API)?_KEYS?(?:_.*)?$/i,
      /^MISTRAL(?:_API)?_KEYS?(?:_.*)?$/i,
    ],
    [/URL/i, /BASE_URL/i, /ENDPOINT/i, /MODEL/i, /AUTH/i, /OPENROUTER/i]
  ).filter((token) => !/^https?:\/\//i.test(token) && !/^sk-or-/i.test(token));
}

function getAlternativeAiBaseUrls(): string[] {
  const configured = collectSecretKeyPool([
    /^AI(?:_API)?_(?:BASE_?)?URLS?(?:_.*)?$/i,
    /^ALT(?:ERNATIVE)?_AI_(?:BASE_?)?URLS?(?:_.*)?$/i,
    /^OPENAI_(?:BASE_?)?URLS?(?:_.*)?$/i,
    /^GROQ_(?:BASE_?)?URLS?(?:_.*)?$/i,
    /^TOGETHER_(?:BASE_?)?URLS?(?:_.*)?$/i,
    /^AIML_(?:BASE_?)?URLS?(?:_.*)?$/i,
  ]).filter((u) => isSafeHttpsUrl(u));
  if (configured.length > 0) return configured;
  if (collectSecretKeyPool([/^GROQ(?:_API)?_KEYS?(?:_.*)?$/i]).length > 0) {
    return ['https://api.groq.com/openai/v1'];
  }
  if (collectSecretKeyPool([/^TOGETHER(?:_API)?_KEYS?(?:_.*)?$/i]).length > 0) {
    return ['https://api.together.xyz/v1'];
  }
  if (collectSecretKeyPool([/^DEEPSEEK(?:_API)?_KEYS?(?:_.*)?$/i]).length > 0) {
    return ['https://api.deepseek.com/v1'];
  }
  return ['https://api.openai.com/v1'];
}

function getAiGatewayAuthKeys(): string[] {
  return collectSecretKeyPool(
    [
      /^(?:AI_)?AUTHENTICATION(?:_KEYS?)?(?:_.*)?$/i,
      /^(?:AI|GATEWAY|OPENROUTER|API)?_?AUTH_KEYS?(?:_.*)?$/i,
    ],
    [/URL/i]
  ).filter((token) => !/^https?:\/\//i.test(token));
}

function hasAnyTextAiConfigured(): boolean {
  return (
    getGeminiApiKeys().length > 0 ||
    getOpenRouterApiKeys().length > 0 ||
    getAlternativeAiApiKeys().length > 0
  );
}

function getGoogleMapsApiKeys(): string[] {
  return collectSecretKeyPool(
    [/GOOGLE_MAPS.*KEY/i, /^MAPS_API_KEYS?(?:_.*)?$/i, /^GMP_.*KEYS?(?:_.*)?$/i],
    [/URL/i]
  ).filter((token) => !/^https?:\/\//i.test(token));
}

function getRotatedMapsApiKey(): string {
  const candidates = getRotatedCandidates('maps', getGoogleMapsApiKeys(), mapsKeyCursor);
  return candidates[0] || '';
}

function getWeb3RpcEndpoints(): string[] {
  const rawUrls = collectSecretKeyPool([
    /^(?:ALCHEMY|ETH(?:EREUM)?|EVM|WEB3|BLOCKCHAIN|CHAIN|JSON_?RPC|MAINNET).*URLS?(?:_.*)?$/i,
    /^RPC_URLS?(?:_.*)?$/i,
  ]);
  const rawKeys = collectSecretKeyPool(
    [
      /^ALCHEMY.*(?:API_?)?KEYS?(?:_.*)?$/i,
      /^(?:WEB3|ETH(?:EREUM)?|RPC)_API_KEYS?(?:_.*)?$/i,
    ],
    [/URL/i, /WEBHOOK/i]
  );

  const seen = new Set<string>();
  const endpoints: string[] = [];

  for (const candidate of rawUrls) {
    if (isSafeHttpsUrl(candidate) && !seen.has(candidate)) {
      seen.add(candidate);
      endpoints.push(candidate);
    }
  }

  for (const token of rawKeys) {
    const resolved = /^https?:\/\//i.test(token)
      ? token
      : `https://eth-mainnet.g.alchemy.com/v2/${token}`;
    if (isSafeHttpsUrl(resolved) && !seen.has(resolved)) {
      seen.add(resolved);
      endpoints.push(resolved);
    }
  }

  return endpoints;
}

function getMailerLiteApiKeys(): string[] {
  return collectSecretKeyPool(
    [/^MAILERLITE(?:_API)?_KEYS?(?:_.*)?$/i],
    [/URL/i]
  ).filter((token) => !/^https?:\/\//i.test(token));
}

function getTwilioApiKeys(): string[] {
  return collectSecretKeyPool(
    [/^TWILIO(?:_API)?_KEYS?(?:_.*)?$/i, /^TWILIO_AUTH_TOKENS?(?:_.*)?$/i],
    [/URL/i, /SID/i]
  ).filter((token) => !/^https?:\/\//i.test(token));
}

function getTwilioAccountSids(): string[] {
  return collectSecretKeyPool(
    [/^TWILIO_ACCOUNT_SIDS?(?:_.*)?$/i],
    [/URL/i]
  ).filter((token) => !/^https?:\/\//i.test(token));
}

function getMeetingBaasApiKeys(): string[] {
  return collectSecretKeyPool(
    [/^MEETING_?BAAS(?:_API)?_KEYS?(?:_.*)?$/i],
    [/URL/i]
  ).filter((token) => !/^https?:\/\//i.test(token));
}

function getPwPushUrls(): string[] {
  return collectSecretKeyPool([/^PWPUSH(?:_API)?_URLS?(?:_.*)?$/i]).filter((u) => {
    if (!isSafeHttpsUrl(u)) return false;
    try {
      const host = new URL(u).hostname.toLowerCase();
      return /(?:^|\.)pwpush\.com$/i.test(host);
    } catch {
      return false;
    }
  });
}

const HOST_SPECIFIC_KEY_PATTERNS: Record<string, RegExp[]> = {
  'aerodatabox.p.rapidapi.com': [/^(?:AERODATABOX|FLIGHT_TRACKER)_API_KEYS?(?:_.*)?$/i],
  'booking-com15.p.rapidapi.com': [/^BOOKING(?:_COM)?_API_KEYS?(?:_.*)?$/i],
  'tripadvisor16.p.rapidapi.com': [/^TRIPADVISOR_API_KEYS?(?:_.*)?$/i],
  'google-flights2.p.rapidapi.com': [/^(?:GOOGLE_)?FLIGHTS?_API_KEYS?(?:_.*)?$/i],
  'visa-requirement.p.rapidapi.com': [/^VISA(?:_MAP)?_API_KEYS?(?:_.*)?$/i],
  'ranked-crime-cities.p.rapidapi.com': [/^(?:CRIME|SAFETY|RANKED_CRIME)_API_KEYS?(?:_.*)?$/i],
};

function getRapidApiKeys(host?: string): string[] {
  const hostPatterns = host ? HOST_SPECIFIC_KEY_PATTERNS[host] || [] : [];
  const hostKeys = hostPatterns.length > 0 ? collectSecretKeyPool(hostPatterns) : [];
  const sharedKeys = collectSecretKeyPool(
    [/RAPID_?API.*KEY/i, /TRAVEL_FEED.*KEY/i, /^RAPID_?KEYS?(?:_.*)?$/i],
    [/APP_ID/i, /URL/i]
  );
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const key of [...hostKeys, ...sharedKeys]) {
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(key);
    }
  }
  return merged;
}

function getRapidApiKey(host?: string): string {
  const candidates = getRotatedCandidates(`rapid:${host || 'shared'}`, getRapidApiKeys(host), rapidKeyCursor);
  return candidates[0] || '';
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
  const allKeys = getRapidApiKeys(host);
  if (allKeys.length === 0) {
    throw new Error('Server live feed credentials are not configured.');
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

  const keyScope = `rapid:${host}`;
  const candidates = getRotatedCandidates(keyScope, allKeys, rapidKeyCursor);
  let lastErrorMsg = 'Live upstream data feed temporarily unavailable.';

  for (let i = 0; i < candidates.length; i += 1) {
    const apiKey = candidates[i];
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
          ? `Upstream channel HTTP ${res.status}: ${detail}`
          : `Upstream channel failed with HTTP ${res.status}`;
        lastErrorMsg = `Live upstream data feed returned HTTP ${res.status}.`;
        console.warn(`[Upstream Telemetry] ${internalMsg}`);

        const shouldRotateToNextKey = res.status === 401 || res.status === 403 || res.status === 429;
        if (res.status === 429) {
          markKeyCooldown(keyScope, apiKey, 60_000);
        } else if (res.status === 401 || res.status === 403) {
          markKeyCooldown(keyScope, apiKey, 300_000);
        }

        if (shouldRotateToNextKey && i < candidates.length - 1) {
          continue;
        }

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
        throw new Error(lastErrorMsg);
      }

      if (!isJson) {
        const internalMsg = `Upstream channel returned non-JSON content-type (${contentType || 'unknown'}).`;
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
    } catch (err: any) {
      lastErrorMsg = err?.message || lastErrorMsg;
      if (i < candidates.length - 1 && (err?.name === 'AbortError' || /fetch failed|network/i.test(lastErrorMsg))) {
        continue;
      }
      if (i === candidates.length - 1) {
        throw err;
      }
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error(lastErrorMsg);
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

function createGeminiClientForKey(apiKey: string, baseUrl?: string): GoogleGenAI {
  const httpOptions: { headers: Record<string, string>; baseUrl?: string } = {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  };
  if (baseUrl && isSafeHttpsUrl(baseUrl)) {
    httpOptions.baseUrl = baseUrl;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions,
  });
}

function getGeminiClient(): GoogleGenAI | null {
  const key = getActiveApiKey();
  if (!key) return null;
  const baseUrls = getGeminiBaseUrls();
  const baseUrl = baseUrls.length > 0 ? getRotatedCandidates('gemini-url', baseUrls, geminiUrlCursor)[0] : undefined;
  return createGeminiClientForKey(key, baseUrl);
}

async function executeWithGeminiRotation<T>(operation: (ai: GoogleGenAI) => Promise<T>): Promise<T> {
  const keys = getGeminiApiKeys();
  if (keys.length === 0) {
    throw new Error('Server AI credentials are not configured.');
  }
  const baseUrls = getGeminiBaseUrls();
  const baseUrl = baseUrls.length > 0 ? getRotatedCandidates('gemini-url', baseUrls, geminiUrlCursor)[0] : undefined;
  const candidates = getRotatedCandidates('gemini', keys, geminiKeyCursor);
  let lastErr: any = null;
  for (let i = 0; i < candidates.length; i += 1) {
    const key = candidates[i];
    try {
      const ai = createGeminiClientForKey(key, baseUrl);
      return await operation(ai);
    } catch (err: any) {
      lastErr = err;
      const parsed = parseGeminiError(err);
      const isRotatableAuthOrQuota =
        parsed.code === 'API_KEY_INVALID' ||
        parsed.code === 'PERMISSION_DENIED' ||
        parsed.code === 'RESOURCE_EXHAUSTED';
      if (isRotatableAuthOrQuota) {
        markKeyCooldown('gemini', key, parsed.code === 'RESOURCE_EXHAUSTED' ? 60_000 : 300_000);
        if (i < candidates.length - 1) {
          continue;
        }
      }
      throw err;
    }
  }
  throw lastErr;
}

function parseGeminiError(error: any): { status: number; code: string; message: string } {
  if (error?.code === 'ALL_AI_PROVIDERS_FAILED') {
    return {
      status: Number(error?.status || 502),
      code: 'ALL_AI_PROVIDERS_FAILED',
      message: String(error?.message || 'All configured AI providers failed.'),
    };
  }
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

if (getGeminiApiKeys().length === 0) {
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

// --- OpenRouter & Alternative OpenAI-Compatible AI Failover Engine ---
function mapOpenRouterModel(modelName?: string, provider: 'openrouter' | 'alternative' = 'openrouter'): string {
  const envDefault =
    provider === 'openrouter'
      ? (process.env.OPENROUTER_MODEL || '').trim()
      : (process.env.AI_API_MODEL || process.env.OPENAI_MODEL || '').trim();
  if (modelName && modelName.includes('/')) {
    return modelName.trim();
  }
  if (provider === 'alternative' && modelName && /^(?:gpt-|o[134]-|claude-|deepseek-|llama-|mistral-)/i.test(modelName)) {
    return modelName.trim();
  }
  if (envDefault) return envDefault;
  const lower = (modelName || '').toLowerCase();
  if (provider === 'openrouter') {
    if (lower.includes('argon') || lower.includes('pro') || lower.includes('carbon')) {
      return 'google/gemini-2.5-pro';
    }
    return 'google/gemini-2.5-flash';
  }
  if (lower.includes('argon') || lower.includes('pro') || lower.includes('carbon')) {
    return 'gpt-4o';
  }
  return 'gpt-4o-mini';
}

function convertGeminiContentsToMessages(
  contents: any,
  systemInstruction?: string
): Array<{ role: 'system' | 'user' | 'assistant'; content: any }> {
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: any }> = [];
  if (systemInstruction && systemInstruction.trim()) {
    messages.push({ role: 'system', content: systemInstruction.trim() });
  }

  const convertPartsToContent = (parts: any[]): any => {
    const hasMedia = parts.some((p) => p?.inlineData?.data);
    if (!hasMedia) {
      return parts
        .map((p) => (typeof p === 'string' ? p : typeof p?.text === 'string' ? p.text : ''))
        .filter(Boolean)
        .join('\n');
    }
    const contentBlocks: any[] = [];
    for (const part of parts) {
      if (typeof part === 'string' && part.trim()) {
        contentBlocks.push({ type: 'text', text: part });
      } else if (typeof part?.text === 'string' && part.text.trim()) {
        contentBlocks.push({ type: 'text', text: part.text });
      } else if (part?.inlineData?.data && part?.inlineData?.mimeType) {
        const mime = String(part.inlineData.mimeType);
        if (mime.startsWith('image/')) {
          contentBlocks.push({
            type: 'image_url',
            image_url: { url: `data:${mime};base64,${part.inlineData.data}` },
          });
        }
      }
    }
    return contentBlocks.length > 0 ? contentBlocks : '';
  };

  if (typeof contents === 'string') {
    messages.push({ role: 'user', content: contents });
    return messages;
  }

  if (Array.isArray(contents)) {
    for (const item of contents) {
      if (typeof item === 'string') {
        messages.push({ role: 'user', content: item });
      } else if (item && Array.isArray(item.parts)) {
        const role = item.role === 'model' || item.role === 'assistant' ? 'assistant' : 'user';
        const converted = convertPartsToContent(item.parts);
        if (converted && (typeof converted !== 'string' || converted.trim())) {
          messages.push({ role, content: converted });
        }
      } else if (item && typeof item.text === 'string') {
        messages.push({ role: 'user', content: item.text });
      }
    }
    return messages.length > 0 ? messages : [{ role: 'user', content: '' }];
  }

  if (contents && Array.isArray(contents.parts)) {
    messages.push({ role: 'user', content: convertPartsToContent(contents.parts) });
    return messages;
  }

  messages.push({ role: 'user', content: JSON.stringify(contents || '') });
  return messages;
}

function extractTextFromOpenAICompatibleResponse(data: any): string {
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part?.text === 'string' ? part.text : ''))
      .filter(Boolean)
      .join('');
  }
  return '';
}

async function callOpenAICompatibleProvider(options: {
  provider: 'openrouter' | 'alternative';
  contents: any;
  systemInstruction?: string;
  model?: string;
  config?: any;
}): Promise<{ text: string; candidates: any[]; providerUsed: string; modelUsed: string }> {
  const { provider, contents, systemInstruction, model, config } = options;
  const keys = provider === 'openrouter' ? getOpenRouterApiKeys() : getAlternativeAiApiKeys();
  if (keys.length === 0) {
    throw new Error(
      provider === 'openrouter'
        ? 'OpenRouter API key is not configured.'
        : 'Alternative AI API keys are not configured.'
    );
  }

  const baseUrls = provider === 'openrouter' ? getOpenRouterBaseUrls() : getAlternativeAiBaseUrls();
  const baseUrl = baseUrls[0].replace(/\/+$/, '');
  const scope = provider === 'openrouter' ? 'openrouter' : 'alternative-ai';
  const cursor = provider === 'openrouter' ? openRouterKeyCursor : alternativeAiKeyCursor;
  const candidates = getRotatedCandidates(scope, keys, cursor);
  if (provider === 'openrouter') {
    openRouterRotationCount += 1;
  } else {
    alternativeAiRotationCount += 1;
  }

  const resolvedSystem =
    typeof config?.systemInstruction === 'string'
      ? config.systemInstruction
      : systemInstruction;
  const messages = convertGeminiContentsToMessages(contents, resolvedSystem);
  const targetModel = mapOpenRouterModel(model, provider);
  const wantsJson = config?.responseMimeType === 'application/json';
  const customAltBaseConfigured =
    provider === 'alternative' &&
    collectSecretKeyPool([
      /^AI(?:_API)?_(?:BASE_?)?URLS?(?:_.*)?$/i,
      /^ALT(?:ERNATIVE)?_AI_(?:BASE_?)?URLS?(?:_.*)?$/i,
    ]).length > 0;
  const authKeys = customAltBaseConfigured ? getAiGatewayAuthKeys() : [];

  let lastError = `${provider === 'openrouter' ? 'OpenRouter' : 'Alternative AI'} service temporarily unavailable.`;

  for (let i = 0; i < candidates.length; i += 1) {
    const apiKey = candidates[i];
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 28_000);
    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
      if (provider === 'openrouter') {
        headers['HTTP-Referer'] = 'https://afriestate.app';
        headers['X-Title'] = 'AfriEstate';
      }
      if (authKeys.length > 0) {
        headers['x-auth-key'] = authKeys[0];
      }

      const payload: Record<string, any> = {
        model: targetModel,
        messages,
      };
      if (typeof config?.temperature === 'number') {
        payload.temperature = config.temperature;
      }
      if (wantsJson) {
        payload.response_format = { type: 'json_object' };
      }

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        let detail = `HTTP ${response.status}`;
        try {
          const errJson = await response.json();
          detail = errJson?.error?.message || errJson?.message || detail;
        } catch {
          // ignore
        }
        if (/incorrect api key|invalid api key/i.test(detail)) {
          detail = `Upstream endpoint (${new URL(baseUrl).hostname}) rejected the configured API key — verify the provider base URL or key in Settings > Secrets.`;
        }
        lastError = `${provider === 'openrouter' ? 'OpenRouter' : 'Alternative AI'}: ${detail}`;
        if (
          response.status === 401 ||
          response.status === 402 ||
          response.status === 403 ||
          response.status === 429 ||
          response.status >= 500
        ) {
          markKeyCooldown(scope, apiKey, response.status === 429 ? 60_000 : 300_000);
          if (i < candidates.length - 1) continue;
        }
        throw new Error(lastError);
      }

      const data = await response.json();
      const text = extractTextFromOpenAICompatibleResponse(data);
      return {
        text,
        candidates: [{ content: { parts: [{ text }] }, finishReason: data?.choices?.[0]?.finish_reason || 'STOP' }],
        providerUsed: provider === 'openrouter' ? 'OpenRouter' : 'Alternative AI Gateway',
        modelUsed: data?.model || targetModel,
      };
    } catch (err: any) {
      lastError = err?.message || lastError;
      if (i < candidates.length - 1) {
        markKeyCooldown(scope, apiKey, 60_000);
        continue;
      }
      throw new Error(lastError);
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error(lastError);
}

async function streamOpenAICompatibleProvider(options: {
  provider: 'openrouter' | 'alternative';
  contents: any;
  systemInstruction?: string;
  model?: string;
  config?: any;
  res: express.Response;
}): Promise<boolean> {
  const { provider, contents, systemInstruction, model, config, res } = options;
  const keys = provider === 'openrouter' ? getOpenRouterApiKeys() : getAlternativeAiApiKeys();
  if (keys.length === 0) return false;

  const baseUrls = provider === 'openrouter' ? getOpenRouterBaseUrls() : getAlternativeAiBaseUrls();
  const baseUrl = baseUrls[0].replace(/\/+$/, '');
  const scope = provider === 'openrouter' ? 'openrouter' : 'alternative-ai';
  const cursor = provider === 'openrouter' ? openRouterKeyCursor : alternativeAiKeyCursor;
  const candidates = getRotatedCandidates(scope, keys, cursor);
  if (provider === 'openrouter') {
    openRouterRotationCount += 1;
  } else {
    alternativeAiRotationCount += 1;
  }

  const messages = convertGeminiContentsToMessages(contents, systemInstruction);
  const targetModel = mapOpenRouterModel(model, provider);
  const modelsToTry =
    provider === 'openrouter' && (!model || !model.includes('/'))
      ? Array.from(new Set([targetModel, 'openrouter/free']))
      : [targetModel];

  for (let i = 0; i < candidates.length; i += 1) {
    const apiKey = candidates[i];
    for (const candidateModel of modelsToTry) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 35_000);
      try {
        const headers: Record<string, string> = {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        };
        if (provider === 'openrouter') {
          headers['HTTP-Referer'] = 'https://afriestate.app';
          headers['X-Title'] = 'AfriEstate';
        }

        const upstream = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: candidateModel,
            messages,
            stream: true,
            ...(typeof config?.temperature === 'number' ? { temperature: config.temperature } : {}),
          }),
          signal: controller.signal,
        });

        if (!upstream.ok || !upstream.body) {
          if (provider === 'openrouter' && (upstream.status === 402 || upstream.status === 404) && candidateModel !== 'openrouter/free') {
            continue;
          }
          if (
            upstream.status === 401 ||
            upstream.status === 403 ||
            upstream.status === 429 ||
            upstream.status >= 500
          ) {
            markKeyCooldown(scope, apiKey, upstream.status === 429 ? 60_000 : 300_000);
          }
          break;
        }

        if (!res.headersSent) {
          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');
          res.flushHeaders?.();
        }

        const reader = upstream.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line.startsWith('data:')) continue;
            const payloadStr = line.slice(5).trim();
            if (payloadStr === '[DONE]') {
              if (!res.writableEnded) {
                res.write('data: [DONE]\n\n');
                res.end();
              }
              return true;
            }
            try {
              const parsed = JSON.parse(payloadStr);
              const deltaText = parsed?.choices?.[0]?.delta?.content;
              if (typeof deltaText === 'string' && deltaText.length > 0 && !res.writableEnded) {
                res.write(`data: ${JSON.stringify({ text: deltaText })}\n\n`);
              }
            } catch {
              // ignore partial JSON frames
            }
          }
        }

        if (!res.writableEnded) {
          res.write('data: [DONE]\n\n');
          res.end();
        }
        return true;
      } catch {
        markKeyCooldown(scope, apiKey, 60_000);
        break;
      } finally {
        clearTimeout(timer);
      }
    }
  }
  return false;
}

async function executeTextAiWithFallback(options: {
  model?: string;
  contents: any;
  systemInstruction?: string;
  config?: any;
  preferredProvider?: 'auto' | 'gemini' | 'openrouter' | 'alternative';
}): Promise<{ text: string; candidates: any[]; providerUsed: string; modelUsed: string }> {
  const { model, contents, systemInstruction, config, preferredProvider = 'auto' } = options;
  const explicitlyOpenRouter = preferredProvider === 'openrouter' || Boolean(model && model.includes('/'));
  const explicitlyAlternative = preferredProvider === 'alternative';
  const explicitlyGemini = preferredProvider === 'gemini';

  const steps: Array<'gemini' | 'openrouter' | 'alternative'> = explicitlyOpenRouter
    ? ['openrouter']
    : explicitlyAlternative
    ? ['alternative']
    : explicitlyGemini
    ? ['gemini']
    : ['gemini', 'openrouter', 'alternative'];

  const stepErrors: string[] = [];
  let lastError: any = new Error('Live AI service is currently unavailable because server credentials are not configured.');

  for (const step of steps) {
    if (step === 'gemini' && getGeminiApiKeys().length > 0) {
      try {
        const targetModel = mapModel(model);
        const sanitizedConfig = sanitizeConfig(config);
        const response = await executeWithGeminiRotation((ai) =>
          ai.models.generateContent({
            model: targetModel,
            contents,
            config: sanitizedConfig,
          })
        );
        return {
          text: response.text || '',
          candidates: response.candidates || [],
          providerUsed: 'Gemini',
          modelUsed: targetModel,
        };
      } catch (err: any) {
        lastError = err;
        stepErrors.push(`Gemini: ${parseGeminiError(err).message}`);
        continue;
      }
    }

    if (step === 'openrouter' && getOpenRouterApiKeys().length > 0) {
      try {
        return await callOpenAICompatibleProvider({
          provider: 'openrouter',
          contents,
          systemInstruction,
          model,
          config,
        });
      } catch (err: any) {
        if (!model || !model.includes('/')) {
          try {
            return await callOpenAICompatibleProvider({
              provider: 'openrouter',
              contents,
              systemInstruction,
              model: 'openrouter/free',
              config,
            });
          } catch (freeErr: any) {
            try {
              return await callOpenAICompatibleProvider({
                provider: 'openrouter',
                contents,
                systemInstruction,
                model: 'openrouter/auto',
                config,
              });
            } catch (autoErr: any) {
              lastError = autoErr;
              stepErrors.push(autoErr?.message || freeErr?.message || err?.message || 'OpenRouter failed');
              continue;
            }
          }
        }
        lastError = err;
        stepErrors.push(err?.message || 'OpenRouter failed');
        continue;
      }
    }

    if (step === 'alternative' && getAlternativeAiApiKeys().length > 0) {
      try {
        return await callOpenAICompatibleProvider({
          provider: 'alternative',
          contents,
          systemInstruction,
          model,
          config,
        });
      } catch (err: any) {
        lastError = err;
        stepErrors.push(err?.message || 'Alternative AI failed');
        continue;
      }
    }
  }

  if (stepErrors.length > 1) {
    const combined: any = new Error(stepErrors.join(' | '));
    combined.status = 502;
    combined.code = 'ALL_AI_PROVIDERS_FAILED';
    throw combined;
  }
  throw lastError;
}

// 1. Generate content (Text, Structured JSON, Multimodal analysis, Audio/TTS, Search Grounding + OpenRouter/AI API failover)
app.post('/api/gemini/generate', async (req, res) => {
  try {
    if (!hasAnyTextAiConfigured()) {
      return res.status(503).json({
        error: 'Live AI service is currently unavailable because server credentials are not configured.',
      });
    }
    const { model, contents, config, provider } = req.body || {};
    if (!contents) {
      return res.status(400).json({ error: 'Missing contents payload' });
    }

    const response = await executeTextAiWithFallback({
      model,
      contents,
      config,
      preferredProvider: provider,
    });

    res.json({
      text: response.text || '',
      candidates: response.candidates || [],
      providerUsed: response.providerUsed,
      modelUsed: response.modelUsed,
    });
  } catch (error: any) {
    const parsed = parseGeminiError(error);
    console.warn(`[API /api/gemini/generate warning] (${parsed.status} ${parsed.code}): ${parsed.message}`);
    res.status(parsed.status).json({ error: parsed.message, code: parsed.code });
  }
});

// 2. Chat Streaming (SSE with automatic OpenRouter / Alternative AI failover)
app.post('/api/gemini/chat-stream', async (req, res) => {
  try {
    if (!hasAnyTextAiConfigured()) {
      return res.status(503).json({
        error: 'Live AI service is currently unavailable because server credentials are not configured.',
      });
    }
    const { model, message, history, systemInstruction, config } = req.body || {};
    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message text is required' });
    }
    const targetModel = mapModel(model);

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

    let streamedViaGemini = false;
    if (getGeminiApiKeys().length > 0 && !(model && String(model).includes('/'))) {
      try {
        const responseStream = await executeWithGeminiRotation((ai) =>
          ai.models.generateContentStream({
            model: targetModel,
            contents,
            config: sanitizeConfig(config),
          })
        );
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders?.();
        streamedViaGemini = true;

        for await (const chunk of responseStream) {
          if (res.writableEnded) break;
          const text = chunk.text || '';
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
        if (!res.writableEnded) {
          res.write('data: [DONE]\n\n');
          res.end();
        }
        return;
      } catch (geminiErr: any) {
        if (getOpenRouterApiKeys().length === 0 && getAlternativeAiApiKeys().length === 0) {
          throw geminiErr;
        }
      }
    }

    if (!streamedViaGemini) {
      const openAiMessages: any[] = [];
      if (Array.isArray(history)) {
        for (const h of history.slice(-20)) {
          openAiMessages.push({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: String(h.text || h.content || '') }],
          });
        }
      }
      openAiMessages.push({ role: 'user', parts: [{ text: message }] });

      const orStreamed = await streamOpenAICompatibleProvider({
        provider: 'openrouter',
        contents: openAiMessages,
        systemInstruction,
        model,
        config,
        res,
      });
      if (orStreamed) return;

      const altStreamed = await streamOpenAICompatibleProvider({
        provider: 'alternative',
        contents: openAiMessages,
        systemInstruction,
        model,
        config,
        res,
      });
      if (altStreamed) return;

      throw new Error('All configured AI streaming providers are currently unavailable.');
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
    if (getGeminiApiKeys().length === 0) {
      return res.status(503).json({
        error: 'Live AI service is currently unavailable because server credentials are not configured.',
      });
    }
    const { prompt, model, config } = req.body || {};
    if (typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    const targetModel = mapModel(model || 'gemini-nano-banana-2.1');
    const response = await executeWithGeminiRotation((ai) =>
      ai.models.generateImages({
        model: targetModel,
        prompt,
        config,
      })
    );
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
    if (getGeminiApiKeys().length === 0) {
      return res.status(503).json({
        error: 'Live AI service is currently unavailable because server credentials are not configured.',
      });
    }
    const { prompt, model, config } = req.body || {};
    if (typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    const targetModel = model || 'veo-3.1-fast-generate-preview';
    const operation = await executeWithGeminiRotation((ai) =>
      ai.models.generateVideos({
        model: targetModel,
        prompt,
        config,
      })
    );
    res.json(operation);
  } catch (error: any) {
    const parsed = parseGeminiError(error);
    console.warn(`[API /api/gemini/generate-videos warning] (${parsed.status} ${parsed.code}): ${parsed.message}`);
    res.status(parsed.status).json({ error: parsed.message, code: parsed.code });
  }
});

app.post('/api/gemini/get-videos-operation', async (req, res) => {
  try {
    if (getGeminiApiKeys().length === 0) {
      return res.status(503).json({
        error: 'Live AI service is currently unavailable because server credentials are not configured.',
      });
    }
    const { operation } = req.body || {};
    if (!operation) {
      return res.status(400).json({ error: 'Missing operation payload' });
    }
    const updatedOperation = await executeWithGeminiRotation((ai) =>
      ai.operations.getVideosOperation({ operation })
    );
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
    const geminiKeys = getGeminiApiKeys();
    if (geminiKeys.length === 0) {
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

    const candidates = getRotatedCandidates('gemini', geminiKeys, geminiKeyCursor);
    let lastStatus = 502;
    for (let i = 0; i < candidates.length; i += 1) {
      const activeKey = candidates[i];
      const videoRes = await fetch(parsedUrl.toString(), {
        headers: {
          'x-goog-api-key': activeKey,
          'User-Agent': 'aistudio-build',
        },
      });
      if (videoRes.ok) {
        const contentType = videoRes.headers.get('content-type') || 'video/mp4';
        res.setHeader('Content-Type', contentType);
        const buffer = await videoRes.arrayBuffer();
        return res.send(Buffer.from(buffer));
      }
      lastStatus = videoRes.status;
      if (videoRes.status === 401 || videoRes.status === 403 || videoRes.status === 429) {
        markKeyCooldown('gemini', activeKey, videoRes.status === 429 ? 60_000 : 300_000);
        if (i < candidates.length - 1) continue;
      }
      break;
    }
    return res.status(lastStatus).send('Upstream video fetch failed');
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
    if (!hasAnyTextAiConfigured()) {
      throw new Error('Server AI credentials are not configured.');
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

    const response = await executeTextAiWithFallback({
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
      : getRapidApiKeys('aerodatabox.p.rapidapi.com').length > 0 && flightTrackerRotationIdx++ % 2 === 0;

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
    if (!hasAnyTextAiConfigured()) {
      throw new Error('Server AI credentials are not configured.');
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
      if (getGeminiApiKeys().length > 0) {
        response = await executeWithGeminiRotation((ai) =>
          ai.models.generateContent({
            model: 'gemini-4-hydrogen',
            contents: prompt,
            config: {
              tools: [{ googleSearch: {} }],
              responseMimeType: 'application/json',
              responseSchema: visaVerificationSchema,
            },
          })
        );
      } else {
        throw new Error('Gemini unconfigured');
      }
    } catch (schemaErr: any) {
      response = await executeTextAiWithFallback({
        model: 'gemini-4-hydrogen',
        contents: `${prompt}\n\nRespond ONLY with raw valid JSON matching keys: entryCategory, stayLimit, estimatedFee, processingTime, officialPortal, bureaucraticSummary, propertyAdvisory, items (array of { id, label, status, summary, last_verified_date, sources: [{ title, url }] }).`,
        config: {
          responseMimeType: 'application/json',
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

  const turnVisaMapFirst = getRapidApiKeys('visa-requirement.p.rapidapi.com').length > 0 && visaAdvisorRotationIdx++ % 2 === 1;
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
    const { query, lat, lng, city, country } = req.body || {};
    const cleanQuery = typeof query === 'string' ? query.trim().slice(0, 260) : '';
    const cleanCity = typeof city === 'string' ? city.trim().slice(0, 80) : '';
    const cleanCountry = typeof country === 'string' ? country.trim().slice(0, 80) : '';

    if (!cleanQuery) {
      return res.status(400).json({ error: 'A location intelligence query is required.' });
    }
    if (getGeminiApiKeys().length === 0) {
      return res.status(503).json({
        error: 'Live Maps Grounding service is unavailable because server credentials are not configured.',
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

    const response = await executeWithGeminiRotation((ai) =>
      ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config,
      })
    );

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
    const { query, city, country } = req.body || {};
    const cleanQuery = typeof query === 'string' ? query.trim().slice(0, 300) : '';
    const cleanCity = typeof city === 'string' ? city.trim().slice(0, 80) : '';
    const cleanCountry = typeof country === 'string' ? country.trim().slice(0, 80) : '';

    if (!cleanQuery) {
      return res.status(400).json({ error: 'A market search query is required.' });
    }
    if (!hasAnyTextAiConfigured()) {
      return res.status(503).json({
        error: 'Live neighborhood intelligence service is unavailable because server credentials are not configured.',
      });
    }

    const locationScope = [cleanCity, cleanCountry].filter(Boolean).join(', ');
    const prompt = locationScope
      ? `Search the live web regarding real estate, urban infrastructure, rental yields, and neighborhood developments for ${locationScope}: ${cleanQuery}. Summarize factual recent findings clearly in 3-4 concise sentences.`
      : `Search the live web for factual recent African real estate & travel intelligence: ${cleanQuery}. Summarize clearly in 3-4 concise sentences.`;

    const response = await executeTextAiWithFallback({
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

// Provide client Maps JS key rotated from server runtime environment
app.get('/api/maps/client-config', (_req, res) => {
  const apiKey = getRotatedMapsApiKey();
  res.json({ apiKey });
});

// 5b-5. Multi-Provider Airport Search (African hubs + Global gateways + TripAdvisor/Booking fallback)
const AFRICAN_AND_GLOBAL_AIRPORTS = [
  // Southern Africa
  { code: 'CPT', city: 'Cape Town', country: 'South Africa', airport: 'Cape Town International Airport' },
  { code: 'JNB', city: 'Johannesburg', country: 'South Africa', airport: 'O.R. Tambo International Airport' },
  { code: 'HLA', city: 'Johannesburg', country: 'South Africa', airport: 'Lanseria International Airport' },
  { code: 'DUR', city: 'Durban', country: 'South Africa', airport: 'King Shaka International Airport' },
  { code: 'GRJ', city: 'George', country: 'South Africa', airport: 'George Airport' },
  { code: 'PLZ', city: 'Gqeberha (Port Elizabeth)', country: 'South Africa', airport: 'Chief Dawid Stuurman International Airport' },
  { code: 'BFN', city: 'Bloemfontein', country: 'South Africa', airport: 'Bram Fischer International Airport' },
  { code: 'GBE', city: 'Gaborone', country: 'Botswana', airport: 'Sir Seretse Khama International Airport' },
  { code: 'MUB', city: 'Maun', country: 'Botswana', airport: 'Maun Airport' },
  { code: 'WDH', city: 'Windhoek', country: 'Namibia', airport: 'Hosea Kutako International Airport' },
  { code: 'MPM', city: 'Maputo', country: 'Mozambique', airport: 'Maputo International Airport' },
  { code: 'LUN', city: 'Lusaka', country: 'Zambia', airport: 'Kenneth Kaunda International Airport' },
  { code: 'HRE', city: 'Harare', country: 'Zimbabwe', airport: 'Robert Gabriel Mugabe International Airport' },
  { code: 'VFA', city: 'Victoria Falls', country: 'Zimbabwe', airport: 'Victoria Falls International Airport' },
  { code: 'LLW', city: 'Lilongwe', country: 'Malawi', airport: 'Kamuzu International Airport' },
  // West & Central Africa
  { code: 'LOS', city: 'Lagos', country: 'Nigeria', airport: 'Murtala Muhammed International Airport' },
  { code: 'ABV', city: 'Abuja', country: 'Nigeria', airport: 'Nnamdi Azikiwe International Airport' },
  { code: 'PHC', city: 'Port Harcourt', country: 'Nigeria', airport: 'Port Harcourt International Airport' },
  { code: 'KAN', city: 'Kano', country: 'Nigeria', airport: 'Mallam Aminu Kano International Airport' },
  { code: 'ACC', city: 'Accra', country: 'Ghana', airport: 'Kotoka International Airport' },
  { code: 'DKR', city: 'Dakar', country: 'Senegal', airport: 'Blaise Diagne International Airport' },
  { code: 'ABJ', city: 'Abidjan', country: 'Côte d’Ivoire', airport: 'Félix-Houphouët-Boigny International Airport' },
  { code: 'LAD', city: 'Luanda', country: 'Angola', airport: 'Quatro de Fevereiro International Airport' },
  { code: 'FIH', city: 'Kinshasa', country: 'DR Congo', airport: 'N’djili International Airport' },
  { code: 'DLA', city: 'Douala', country: 'Cameroon', airport: 'Douala International Airport' },
  { code: 'NSI', city: 'Yaoundé', country: 'Cameroon', airport: 'Yaoundé Nsimalen International Airport' },
  { code: 'LFW', city: 'Lomé', country: 'Togo', airport: 'Gnassingbé Eyadéma International Airport' },
  { code: 'COO', city: 'Cotonou', country: 'Benin', airport: 'Cadjehoun Airport' },
  { code: 'BJL', city: 'Banjul', country: 'Gambia', airport: 'Banjul International Airport' },
  // East Africa & Indian Ocean
  { code: 'NBO', city: 'Nairobi', country: 'Kenya', airport: 'Jomo Kenyatta International Airport' },
  { code: 'MBA', city: 'Mombasa', country: 'Kenya', airport: 'Moi International Airport' },
  { code: 'KGL', city: 'Kigali', country: 'Rwanda', airport: 'Kigali International Airport' },
  { code: 'ADD', city: 'Addis Ababa', country: 'Ethiopia', airport: 'Bole International Airport' },
  { code: 'DAR', city: 'Dar es Salaam', country: 'Tanzania', airport: 'Julius Nyerere International Airport' },
  { code: 'ZNZ', city: 'Zanzibar', country: 'Tanzania', airport: 'Abeid Amani Karume International Airport' },
  { code: 'JRO', city: 'Kilimanjaro', country: 'Tanzania', airport: 'Kilimanjaro International Airport' },
  { code: 'EBB', city: 'Entebbe', country: 'Uganda', airport: 'Entebbe International Airport' },
  { code: 'MRU', city: 'Port Louis', country: 'Mauritius', airport: 'Sir Seewoosagur Ramgoolam International Airport' },
  { code: 'SEZ', city: 'Mahé', country: 'Seychelles', airport: 'Seychelles International Airport' },
  // North Africa
  { code: 'CAI', city: 'Cairo', country: 'Egypt', airport: 'Cairo International Airport' },
  { code: 'HRG', city: 'Hurghada', country: 'Egypt', airport: 'Hurghada International Airport' },
  { code: 'SSH', city: 'Sharm El Sheikh', country: 'Egypt', airport: 'Sharm El Sheikh International Airport' },
  { code: 'CMN', city: 'Casablanca', country: 'Morocco', airport: 'Mohammed V International Airport' },
  { code: 'RAK', city: 'Marrakesh', country: 'Morocco', airport: 'Marrakesh Menara Airport' },
  { code: 'TUN', city: 'Tunis', country: 'Tunisia', airport: 'Tunis–Carthage International Airport' },
  { code: 'ALG', city: 'Algiers', country: 'Algeria', airport: 'Houari Boumediene Airport' },
  // Global Gateways
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

function matchDirectoryAirports(query: string) {
  const qLower = query.toLowerCase();
  return AFRICAN_AND_GLOBAL_AIRPORTS.filter(
    (a) =>
      a.city.toLowerCase().includes(qLower) ||
      a.code.toLowerCase().includes(qLower) ||
      a.country.toLowerCase().includes(qLower) ||
      a.airport.toLowerCase().includes(qLower)
  );
}

app.get('/api/travel/airports/search', async (req, res) => {
  const query = typeof req.query.query === 'string' ? req.query.query.trim().slice(0, 60) : '';
  if (query.length < 2) {
    return res.json({ airports: [], isLive: true, providerUsed: 'AfriEstate Global Airport Directory' });
  }
  const directoryMatches = matchDirectoryAirports(query);
  try {
    let mappedAirports: Array<{ code: string; city: string; country: string; airport: string }> = [];
    const raw = await callRapidApi<any>(
      'tripadvisor16.p.rapidapi.com',
      `/api/v1/flights/searchAirport?query=${encodeURIComponent(query)}`,
      { cacheKey: `ta_airport:${query.toLowerCase()}`, cacheTtlMs: 3600_000 }
    );
    const list = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
    mappedAirports = list
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
      .filter(Boolean) as Array<{ code: string; city: string; country: string; airport: string }>;

    if (mappedAirports.length === 0) {
      try {
        const bookingRaw = await callRapidApi<any>(
          'booking-com15.p.rapidapi.com',
          `/api/v1/flights/searchDestination?query=${encodeURIComponent(query)}`,
          { cacheKey: `bk_airport:${query.toLowerCase()}`, cacheTtlMs: 3600_000 }
        );
        const bkList = Array.isArray(bookingRaw?.data) ? bookingRaw.data : [];
        mappedAirports = bkList
          .filter((item: any) => String(item?.type || '').toUpperCase() === 'AIRPORT' || item?.code)
          .map((item: any) => {
            const code = String(item?.code || item?.id || '').split('.')[0].trim().toUpperCase();
            const city = String(item?.cityName || item?.name || '').trim();
            const country = String(item?.countryName || 'International').trim();
            const airport = String(item?.name || `${city} Airport`).trim();
            if (!code || code.length !== 3) return null;
            return { code, city: city || airport, country, airport };
          })
          .filter(Boolean) as Array<{ code: string; city: string; country: string; airport: string }>;
      } catch {
        // Directory fallback merges below
      }
    }

    const seenCodes = new Set(mappedAirports.map((a) => a.code));
    const mergedAirports = [
      ...mappedAirports,
      ...directoryMatches.filter((g) => !seenCodes.has(g.code)),
    ];

    res.json({
      airports: mergedAirports,
      isLive: true,
      providerUsed: 'AfriEstate Global Airport Directory',
    });
  } catch (error: any) {
    console.warn('[API /api/travel/airports/search warning]:', error?.message || 'unavailable');
    res.json({
      airports: directoryMatches,
      isLive: directoryMatches.length > 0,
      upstreamWarning: directoryMatches.length === 0 ? 'Live airport directory lookup temporarily unavailable.' : undefined,
      providerUsed: 'AfriEstate Gateway Airport Directory',
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

    const baseNormalized = rows
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

    const totalCount = Math.max(1, baseNormalized.length);
    const normalized = baseNormalized.map((item) => ({
      ...item,
      hasNumericIndices: item.crimeIndex !== null && item.safetyIndex !== null,
      riskTier:
        item.rank <= 25
          ? 'Top-25 High Watchlist'
          : item.rank <= 60
          ? 'Elevated Metro Watch'
          : 'Standard Metro Watch',
      globalRankPercentile: Math.max(1, Math.round((item.rank / totalCount) * 100)),
    }));

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

// 5b-8. Internal Secret & Endpoint Rotation Health Snapshot (never exposes raw keys, paths, or secret URLs)
function buildRotationStatusPayload() {
  const rpcEndpoints = getWeb3RpcEndpoints();
  const mailerLiteKeys = getMailerLiteApiKeys();
  const twilioKeys = getTwilioApiKeys();
  const meetingBaasKeys = getMeetingBaasApiKeys();
  const pwPushUrls = getPwPushUrls();
  const openRouterKeys = getOpenRouterApiKeys();
  const alternativeAiKeys = getAlternativeAiApiKeys();
  const aiAuthKeys = getAiGatewayAuthKeys();
  return {
    liveFeedsConfigured: getRapidApiKeys().length > 0,
    feedAppConfigured: collectSecretKeyPool([/^(?:X_)?RAPID_?API_APP_IDS?(?:_.*)?$/i]).length > 0,
    keyPoolSize: getRapidApiKeys().length,
    rapidAppIdPoolSize: collectSecretKeyPool([/^(?:X_)?RAPID_?API_APP_IDS?(?:_.*)?$/i]).length,
    geminiKeyPoolSize: getGeminiApiKeys().length,
    geminiUrlPoolSize: getGeminiBaseUrls().length,
    openRouterKeyPoolSize: openRouterKeys.length,
    alternativeAiKeyPoolSize: alternativeAiKeys.length,
    aiAuthKeyPoolSize: aiAuthKeys.length,
    mapsKeyPoolSize: getGoogleMapsApiKeys().length,
    web3RpcPoolSize: rpcEndpoints.length,
    mailerLiteKeyPoolSize: mailerLiteKeys.length,
    twilioKeyPoolSize: twilioKeys.length,
    meetingBaasKeyPoolSize: meetingBaasKeys.length,
    pwPushUrlPoolSize: pwPushUrls.length,
    aiConfigured: hasAnyTextAiConfigured(),
    geminiConfigured: getGeminiApiKeys().length > 0,
    openRouterConfigured: openRouterKeys.length > 0,
    alternativeAiConfigured: alternativeAiKeys.length > 0,
    aiAuthKeyConfigured: aiAuthKeys.length > 0,
    mapsConfigured: getGoogleMapsApiKeys().length > 0,
    web3Configured: rpcEndpoints.length > 0,
    mailerLiteConfigured: mailerLiteKeys.length > 0,
    twilioConfigured: twilioKeys.length > 0,
    meetingBaasConfigured: meetingBaasKeys.length > 0,
    pwPushConfigured: pwPushUrls.length > 0,
    rotationCounters: {
      flightTracker: flightTrackerRotationIdx,
      visaAdvisor: visaAdvisorRotationIdx,
      travelLanguages: travelLanguagesRotationIdx,
      web3Rpc: web3RpcRotationCount,
      mailerLite: mailerLiteRotationCount,
      twilio: twilioRotationCount,
      meetingBaas: meetingBaasRotationCount,
      pwPush: pwPushRotationCount,
      openRouter: openRouterRotationCount,
      alternativeAi: alternativeAiRotationCount,
    },
    channels: Array.from(rapidHostHealth.values()).map((h, idx) => ({
      channel: `feed-${idx + 1}`,
      state: h.state,
      lastStatus: h.lastStatus,
      lastCheckedAt: h.lastCheckedAt,
    })),
    rpcChannels: rpcEndpoints.map((url, idx) => {
      let hostLabel = 'rpc-endpoint';
      try {
        hostLabel = new URL(url).hostname;
      } catch {
        // ignore
      }
      return {
        channel: `rpc-${idx + 1}`,
        host: hostLabel,
        state: isKeyCoolingDown('web3-rpc', url) ? 'cooldown' : 'ready',
      };
    }),
    pwPushChannels: pwPushUrls.map((url, idx) => {
      let hostLabel = 'pwpush.com';
      try {
        hostLabel = new URL(url).hostname;
      } catch {
        // ignore
      }
      return {
        channel: `pwpush-${idx + 1}`,
        host: hostLabel,
        state: isKeyCoolingDown('pwpush-url', url) ? 'cooldown' : 'ready',
      };
    }),
    checkedAt: new Date().toISOString(),
  };
}

app.get('/api/travel/rotation-status', (_req, res) => {
  res.json(buildRotationStatusPayload());
});

app.get('/api/secrets/rotation-status', (_req, res) => {
  res.json(buildRotationStatusPayload());
});

// 5b-9. Rotated Server-Side Web3 / Alchemy JSON-RPC Proxy (no secrets ever leave server)
const ALLOWED_WEB3_RPC_METHODS = new Set([
  'eth_blockNumber',
  'eth_chainId',
  'eth_getBalance',
  'eth_call',
  'eth_getTransactionByHash',
  'eth_getTransactionReceipt',
  'eth_getBlockByNumber',
  'eth_getBlockByHash',
  'eth_gasPrice',
  'eth_feeHistory',
  'eth_estimateGas',
  'eth_getCode',
  'eth_getLogs',
  'net_version',
  'web3_clientVersion',
  'alchemy_getTokenBalances',
  'alchemy_getAssetTransfers',
]);

async function executeWeb3RpcWithRotation(rpcPayload: { id: number | string; jsonrpc: '2.0'; method: string; params: any[] }) {
  const endpoints = getWeb3RpcEndpoints();
  if (endpoints.length === 0) {
    throw new Error('No Web3/Alchemy RPC URLs or API keys are configured in Secrets.');
  }
  const candidates = getRotatedCandidates('web3-rpc', endpoints, web3RpcCursor);
  web3RpcRotationCount += 1;
  let lastError = 'Web3 RPC provider unavailable.';

  for (let i = 0; i < candidates.length; i += 1) {
    const endpointUrl = candidates[i];
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12_000);
    try {
      const rpcRes = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
        },
        body: JSON.stringify(rpcPayload),
        signal: controller.signal,
      });

      if (!rpcRes.ok) {
        lastError = `Upstream Web3 RPC returned HTTP ${rpcRes.status}.`;
        if (rpcRes.status === 401 || rpcRes.status === 403 || rpcRes.status === 429 || rpcRes.status >= 500) {
          markKeyCooldown('web3-rpc', endpointUrl, rpcRes.status === 429 ? 60_000 : 300_000);
          if (i < candidates.length - 1) continue;
        }
        throw new Error(lastError);
      }

      const data = await rpcRes.json();
      if (data?.error && Number(data.error?.code) === 429 && i < candidates.length - 1) {
        markKeyCooldown('web3-rpc', endpointUrl, 60_000);
        continue;
      }
      return {
        data,
        poolSize: endpoints.length,
        channelIndex: (endpoints.indexOf(endpointUrl) + 1) || 1,
      };
    } catch (err: any) {
      lastError = err?.message || lastError;
      if (i < candidates.length - 1) {
        markKeyCooldown('web3-rpc', endpointUrl, 60_000);
        continue;
      }
      throw new Error(lastError);
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error(lastError);
}

app.get('/api/web3/health', async (_req, res) => {
  const endpoints = getWeb3RpcEndpoints();
  if (endpoints.length === 0) {
    return res.status(503).json({
      ok: false,
      rpcPoolSize: 0,
      error: 'No Web3/Alchemy RPC URLs or API keys found in Secrets.',
      checkedAt: new Date().toISOString(),
    });
  }
  try {
    const result = await executeWeb3RpcWithRotation({
      id: 1,
      jsonrpc: '2.0',
      method: 'eth_blockNumber',
      params: [],
    });
    const hexBlock = typeof result.data?.result === 'string' ? result.data.result : null;
    const blockNumber = hexBlock ? parseInt(hexBlock, 16) : null;
    res.json({
      ok: Boolean(hexBlock),
      chain: 'eth-mainnet',
      blockNumberHex: hexBlock,
      blockNumber: Number.isFinite(blockNumber) ? blockNumber : null,
      rpcPoolSize: result.poolSize,
      channelUsed: `rpc-${result.channelIndex}`,
      checkedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(502).json({
      ok: false,
      rpcPoolSize: endpoints.length,
      error: err?.message || 'Web3 RPC health check failed.',
      checkedAt: new Date().toISOString(),
    });
  }
});

app.post('/api/web3/rpc', async (req, res) => {
  try {
    const { id = 1, method, params = [] } = req.body || {};
    const cleanMethod = typeof method === 'string' ? method.trim() : '';
    if (!cleanMethod || !ALLOWED_WEB3_RPC_METHODS.has(cleanMethod)) {
      return res.status(400).json({
        error: 'Unsupported or disallowed JSON-RPC method.',
      });
    }
    const safeParams = Array.isArray(params) ? params.slice(0, 10) : [];
    const safeId = typeof id === 'number' || typeof id === 'string' ? id : 1;

    const result = await executeWeb3RpcWithRotation({
      id: safeId,
      jsonrpc: '2.0',
      method: cleanMethod,
      params: safeParams,
    });
    res.json(result.data);
  } catch (err: any) {
    const status = String(err?.message || '').includes('configured') ? 503 : 502;
    res.status(status).json({ error: err?.message || 'Web3 JSON-RPC request failed.' });
  }
});

// 5b-10. Rotated Server-Side Integrations (MailerLite, Twilio, MeetingBaas, Password Pusher)
async function callMailerLiteWithRotation(
  endpointPath: string,
  options: { method?: 'GET' | 'POST'; body?: Record<string, any> } = {}
) {
  const keys = getMailerLiteApiKeys();
  if (keys.length === 0) {
    throw new Error('MailerLite API key is not configured in Secrets.');
  }
  const candidates = getRotatedCandidates('mailerlite', keys, mailerLiteKeyCursor);
  mailerLiteRotationCount += 1;
  let lastError = 'MailerLite service temporarily unavailable.';

  for (let i = 0; i < candidates.length; i += 1) {
    const apiKey = candidates[i];
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12_000);
    try {
      const response = await fetch(`https://connect.mailerlite.com/api${endpointPath}`, {
        method: options.method || 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });
      if (!response.ok) {
        lastError = `MailerLite returned HTTP ${response.status}.`;
        if (response.status === 401 || response.status === 403 || response.status === 429 || response.status >= 500) {
          markKeyCooldown('mailerlite', apiKey, response.status === 429 ? 60_000 : 300_000);
          if (i < candidates.length - 1) continue;
        }
        throw new Error(lastError);
      }
      const data = await response.json();
      return { data, poolSize: keys.length };
    } catch (err: any) {
      lastError = err?.message || lastError;
      if (i < candidates.length - 1) {
        markKeyCooldown('mailerlite', apiKey, 60_000);
        continue;
      }
      throw new Error(lastError);
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error(lastError);
}

app.get('/api/integrations/health', async (req, res) => {
  const probe = req.query.probe === '1';
  const mailerLiteKeys = getMailerLiteApiKeys();
  const twilioKeys = getTwilioApiKeys();
  const twilioSids = getTwilioAccountSids();
  const meetingBaasKeys = getMeetingBaasApiKeys();
  const pwPushUrls = getPwPushUrls();

  let mailerLiteProbe: { ok: boolean; error?: string } | null = null;
  let meetingBaasProbe: { ok: boolean; error?: string } | null = null;
  let openRouterProbe: { ok: boolean; error?: string } | null = null;
  const openRouterKeys = getOpenRouterApiKeys();

  if (probe && openRouterKeys.length > 0) {
    const candidates = getRotatedCandidates('openrouter', openRouterKeys, openRouterKeyCursor);
    const baseUrl = getOpenRouterBaseUrls()[0].replace(/\/+$/, '');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    try {
      const orRes = await fetch(`${baseUrl}/auth/key`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${candidates[0]}`,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });
      if (orRes.ok) {
        openRouterProbe = { ok: true };
      } else {
        openRouterProbe = { ok: false, error: `OpenRouter auth check returned HTTP ${orRes.status}.` };
      }
    } catch (err: any) {
      openRouterProbe = { ok: false, error: err?.message || 'OpenRouter probe failed.' };
    } finally {
      clearTimeout(timer);
    }
  }

  if (probe && mailerLiteKeys.length > 0) {
    try {
      await callMailerLiteWithRotation('/groups?limit=1');
      mailerLiteProbe = { ok: true };
    } catch (err: any) {
      mailerLiteProbe = { ok: false, error: err?.message || 'MailerLite probe failed.' };
    }
  }

  if (probe && meetingBaasKeys.length > 0) {
    const candidates = getRotatedCandidates('meetingbaas', meetingBaasKeys, meetingBaasKeyCursor);
    meetingBaasRotationCount += 1;
    let mbError = 'MeetingBaas probe failed.';
    for (let i = 0; i < candidates.length; i += 1) {
      const apiKey = candidates[i];
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10_000);
      try {
        const mbRes = await fetch('https://api.meetingbaas.com/v2/calendars', {
          method: 'GET',
          headers: {
            'x-meeting-baas-api-key': apiKey,
            Accept: 'application/json',
          },
          signal: controller.signal,
        });
        if (mbRes.ok) {
          meetingBaasProbe = { ok: true };
          break;
        }
        mbError = `MeetingBaas returned HTTP ${mbRes.status}.`;
        if (mbRes.status === 401 || mbRes.status === 403 || mbRes.status === 429 || mbRes.status >= 500) {
          markKeyCooldown('meetingbaas', apiKey, mbRes.status === 429 ? 60_000 : 300_000);
          if (i < candidates.length - 1) continue;
        }
        meetingBaasProbe = { ok: false, error: mbError };
        break;
      } catch (err: any) {
        mbError = err?.message || mbError;
        if (i < candidates.length - 1) {
          markKeyCooldown('meetingbaas', apiKey, 60_000);
          continue;
        }
        meetingBaasProbe = { ok: false, error: mbError };
      } finally {
        clearTimeout(timer);
      }
    }
  }

  if (twilioKeys.length > 0) {
    getRotatedCandidates('twilio', twilioKeys, twilioKeyCursor);
    twilioRotationCount += 1;
  }
  if (pwPushUrls.length > 0) {
    getRotatedCandidates('pwpush-url', pwPushUrls, pwPushUrlCursor);
    pwPushRotationCount += 1;
  }

  res.json({
    mailerLite: {
      configured: mailerLiteKeys.length > 0,
      poolSize: mailerLiteKeys.length,
      probe: mailerLiteProbe,
    },
    twilio: {
      configured: twilioKeys.length > 0,
      poolSize: twilioKeys.length,
      accountSidConfigured: twilioSids.length > 0,
      note: twilioKeys.length > 0 && twilioSids.length === 0
        ? 'API Key loaded; pair with TWILIO_ACCOUNT_SID for live SMS/Voice calls.'
        : undefined,
    },
    meetingBaas: {
      configured: meetingBaasKeys.length > 0,
      poolSize: meetingBaasKeys.length,
      probe: meetingBaasProbe,
    },
    pwPush: {
      configured: pwPushUrls.length > 0,
      poolSize: pwPushUrls.length,
      // Intentionally never auto-fetched so view-limited links are preserved
      autoFetchDisabled: true,
    },
    aiProviders: {
      geminiPoolSize: getGeminiApiKeys().length,
      openRouterPoolSize: openRouterKeys.length,
      openRouterProbe,
      alternativeAiPoolSize: getAlternativeAiApiKeys().length,
      aiAuthKeyConfigured: getAiGatewayAuthKeys().length > 0,
    },
    checkedAt: new Date().toISOString(),
  });
});

// 5b-11. Unified Multi-Provider AI & OpenRouter Endpoints (Alternative/Failover to Gemini)
app.get('/api/ai/providers', (_req, res) => {
  res.json({
    anyConfigured: hasAnyTextAiConfigured(),
    providers: {
      gemini: {
        configured: getGeminiApiKeys().length > 0,
        poolSize: getGeminiApiKeys().length,
        defaultModel: 'gemini-4-hydrogen',
      },
      openRouter: {
        configured: getOpenRouterApiKeys().length > 0,
        poolSize: getOpenRouterApiKeys().length,
        baseUrlHost: (() => {
          try {
            return new URL(getOpenRouterBaseUrls()[0]).hostname;
          } catch {
            return 'openrouter.ai';
          }
        })(),
        defaultModel: mapOpenRouterModel(undefined, 'openrouter'),
      },
      alternativeAi: {
        configured: getAlternativeAiApiKeys().length > 0,
        poolSize: getAlternativeAiApiKeys().length,
        baseUrlHost: (() => {
          try {
            return new URL(getAlternativeAiBaseUrls()[0]).hostname;
          } catch {
            return 'api.openai.com';
          }
        })(),
        authKeyConfigured: getAiGatewayAuthKeys().length > 0,
        defaultModel: mapOpenRouterModel(undefined, 'alternative'),
      },
    },
    checkedAt: new Date().toISOString(),
  });
});

app.post('/api/ai/chat', async (req, res) => {
  try {
    if (!hasAnyTextAiConfigured()) {
      return res.status(503).json({
        error: 'No AI API keys are currently configured in Settings > Secrets.',
      });
    }
    const { provider = 'auto', model, prompt, contents, messages, systemInstruction, config } = req.body || {};
    const resolvedContents =
      contents ||
      (Array.isArray(messages) && messages.length > 0
        ? messages.map((m: any) => ({
            role: m?.role === 'assistant' || m?.role === 'model' ? 'model' : 'user',
            parts: [{ text: String(m?.content ?? m?.text ?? '') }],
          }))
        : typeof prompt === 'string' && prompt.trim()
        ? prompt.trim()
        : null);

    if (!resolvedContents) {
      return res.status(400).json({ error: 'Provide prompt, contents, or messages.' });
    }

    const result = await executeTextAiWithFallback({
      model,
      contents: resolvedContents,
      systemInstruction,
      config,
      preferredProvider: provider,
    });

    res.json({
      text: result.text,
      candidates: result.candidates,
      providerUsed: result.providerUsed,
      modelUsed: result.modelUsed,
    });
  } catch (err: any) {
    const parsed = parseGeminiError(err);
    res.status(parsed.status).json({ error: parsed.message, code: parsed.code });
  }
});

app.post('/api/integrations/newsletter/subscribe', async (req, res) => {
  try {
    const cleanEmail = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase().slice(0, 140) : '';
    const cleanName = typeof req.body?.name === 'string' ? req.body.name.trim().slice(0, 120) : '';
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }
    const result = await callMailerLiteWithRotation('/subscribers', {
      method: 'POST',
      body: {
        email: cleanEmail,
        ...(cleanName ? { fields: { name: cleanName } } : {}),
      },
    });
    res.json({
      ok: true,
      subscribed: true,
      status: result.data?.data?.status || 'active',
    });
  } catch (err: any) {
    const status = String(err?.message || '').includes('configured') ? 503 : 502;
    res.status(status).json({ error: err?.message || 'Newsletter subscription failed.' });
  }
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
    if (!Number.isFinite(numericAmount) || numericAmount <= 0 || numericAmount > 50_000_000) {
      return res.status(400).json({ error: 'A valid positive settlement amount within transaction limits is required.' });
    }

    const normalizedCurrency = String(currency || 'ZAR').trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(normalizedCurrency)) {
      return res.status(400).json({ error: 'A valid 3-letter ISO currency code is required.' });
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

    if (paymentDetails?.cardCvv || (typeof paymentDetails?.cardNumber === 'string' && paymentDetails.cardNumber.replace(/\D/g, '').length > 4)) {
      return res.status(400).json({
        error: 'Raw card PAN and CVV codes must never be transmitted to this endpoint; supply cardLast4 or a payment gateway token.',
      });
    }

    let safeCardBrand: string | undefined;
    let safeCardLast4: string | undefined;
    if (paymentMethod === 'Card') {
      const last4 = String(paymentDetails?.cardLast4 || '').replace(/\D/g, '');
      const expiry = String(paymentDetails?.cardExpiry || '').trim();
      const brand = String(paymentDetails?.cardBrand || 'Card').trim().slice(0, 24);
      if (last4.length !== 4 || !/^(0[1-9]|1[0-2])\/\d{2,4}$/.test(expiry)) {
        return res.status(400).json({
          error: 'Tokenized card authorization requires valid last 4 digits and expiry (MM/YY).',
        });
      }
      safeCardLast4 = last4;
      safeCardBrand = brand;
    }

    if (paymentMethod.includes('Mobile Money')) {
      const msisdn = String(paymentDetails?.mobileMoneyPhone || '').replace(/\D/g, '');
      if (msisdn.length < 8 || msisdn.length > 16) {
        return res.status(400).json({
          error: 'Please enter a valid Mobile Money MSISDN phone number to receive the authorization prompt.',
        });
      }
    }

    const randomBlock = crypto.randomInt(100000, 999999);
    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const prefix =
      normalizedCategory === 'flight'
        ? 'AFR-FLT'
        : normalizedCategory === 'short-stay'
        ? 'AFR-STY'
        : 'AFR-CAR';

    const transactionRef = `${prefix}-${randomBlock}`;
    const settlementId = `STL-${Date.now().toString(36).toUpperCase()}-${randomSuffix}`;
    const authorizationCode = `AUTH-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const cleanMetadata =
      typeof metadata === 'object' && metadata !== null && !Array.isArray(metadata)
        ? Object.fromEntries(Object.entries(metadata).slice(0, 20))
        : {};

    res.json({
      ok: true,
      status: 'Settled',
      settlementMode: 'sandbox-gateway',
      bookingCategory: normalizedCategory,
      itemId: String(itemId || '').slice(0, 120),
      itemTitle: String(itemTitle || 'AfriEstate Reservation').slice(0, 180),
      amount: Math.round(numericAmount * 100) / 100,
      currency: normalizedCurrency,
      paymentMethod,
      cardBrand: safeCardBrand,
      cardLast4: safeCardLast4,
      customerName: cleanName,
      customerEmail: cleanEmail,
      transactionRef,
      settlementId,
      authorizationCode,
      settledAt: new Date().toISOString(),
      protectionGuarantee: 'AfriEstate Scoped Booking Escrow Protection (Sandbox Settlement)',
      metadata: cleanMetadata,
    });
  } catch (error: any) {
    console.error('[API /api/payments/settle error]:', error);
    res.status(500).json({ error: error?.message || 'Payment settlement failed.' });
  }
});

// 6. Gemini Live API WebSocket Bridge (bounded payload & connection cap)
const MAX_LIVE_WS_CONNECTIONS = 25;
let activeLiveWsCount = 0;
const wss = new WebSocketServer({ server, path: '/api/live', maxPayload: 2 * 1024 * 1024 });

wss.on('connection', async (clientWs: WebSocket) => {
  if (activeLiveWsCount >= MAX_LIVE_WS_CONNECTIONS) {
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ type: 'error', error: 'Live voice capacity temporarily reached. Please retry shortly.' }));
      clientWs.close();
    }
    return;
  }
  activeLiveWsCount += 1;
  let released = false;
  const releaseSlot = () => {
    if (!released) {
      released = true;
      activeLiveWsCount = Math.max(0, activeLiveWsCount - 1);
    }
  };
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
      releaseSlot();
      console.log('[LiveAPI] Client WebSocket closed');
      try {
        session?.close();
      } catch (e) {
        // ignore
      }
    });

    clientWs.on('error', (err) => {
      releaseSlot();
      console.error('[LiveAPI] Client WebSocket error:', err);
      try {
        session?.close();
      } catch (e) {
        // ignore
      }
    });
  } catch (err: any) {
    releaseSlot();
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

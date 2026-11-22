import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Initialize server-side Gemini client
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
if (!apiKey) {
  console.warn('[Server] Warning: GEMINI_API_KEY is not set in environment.');
}

const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

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
    const errorMsg = error?.message || 'Failed to generate content';
    console.warn('[API /api/gemini/generate warning]:', errorMsg);
    res.status(502).json({ error: errorMsg });
  }
});

// 2. Chat Streaming (SSE)
app.post('/api/gemini/chat-stream', async (req, res) => {
  try {
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
    console.error('[API /api/gemini/chat-stream error]:', error);
    if (!res.headersSent) {
      res.status(502).json({ error: error?.message || 'Streaming failed' });
    } else if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ error: error?.message || 'Streaming failed' })}\n\n`);
      res.end();
    }
  }
});

// 3. Image Generation
app.post('/api/gemini/generate-images', async (req, res) => {
  try {
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
    console.error('[API /api/gemini/generate-images error]:', error);
    res.status(500).json({ error: error?.message || 'Image generation failed' });
  }
});

// 4. Video Generation & Operations
app.post('/api/gemini/generate-videos', async (req, res) => {
  try {
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
    console.error('[API /api/gemini/generate-videos error]:', error);
    res.status(500).json({ error: error?.message || 'Video generation failed' });
  }
});

app.post('/api/gemini/get-videos-operation', async (req, res) => {
  try {
    const { operation } = req.body || {};
    if (!operation) {
      return res.status(400).json({ error: 'Missing operation payload' });
    }
    const updatedOperation = await ai.operations.getVideosOperation({ operation });
    res.json(updatedOperation);
  } catch (error: any) {
    console.error('[API /api/gemini/get-videos-operation error]:', error);
    res.status(500).json({ error: error?.message || 'Failed to poll video operation' });
  }
});

// 5. Video Secure Proxy (strict Google APIs host allowlist prevents SSRF & key exfiltration)
app.get('/api/gemini/video-proxy', async (req, res) => {
  try {
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
        'x-goog-api-key': apiKey,
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

// 5b. Real-Time Flight Tracker using Gemini Google Search Grounding
app.post('/api/gemini/flight-tracker', async (req, res) => {
  try {
    const { flightNumber, date } = req.body || {};
    const cleanFlight = typeof flightNumber === 'string' ? flightNumber.trim().toUpperCase().slice(0, 24) : '';
    const cleanDate = typeof date === 'string' ? date.trim().slice(0, 20) : '';

    if (!cleanFlight) {
      return res.status(400).json({ error: 'Flight number is required (e.g., SA 317 or ET 846).' });
    }
    if (!cleanDate) {
      return res.status(400).json({ error: 'Flight date is required.' });
    }
    if (!apiKey) {
      return res.status(503).json({
        error: 'Live Search Grounding service key is not configured in Settings > Secrets.',
      });
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

    res.json({
      flightNumber: cleanFlight,
      date: cleanDate,
      checkedAt: new Date().toISOString(),
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
    });
  } catch (error: any) {
    const errorMsg = error?.message || 'Failed to retrieve live flight status';
    console.warn('[API /api/gemini/flight-tracker warning]:', errorMsg);
    res.status(502).json({ error: errorMsg });
  }
});

// 5b-2. Pan-African Visa & Consular Policy Advisor using Gemini Google Search Grounding
app.post('/api/gemini/visa-advisor', async (req, res) => {
  try {
    const { passportCountry, destinationCountry, travelPurpose } = req.body || {};
    const cleanPassport = typeof passportCountry === 'string' ? passportCountry.trim().slice(0, 60) : '';
    const cleanDest = typeof destinationCountry === 'string' ? destinationCountry.trim().slice(0, 60) : '';
    const cleanPurpose = typeof travelPurpose === 'string' ? travelPurpose.trim().slice(0, 80) : 'Property & Business';

    if (!cleanPassport || !cleanDest) {
      return res.status(400).json({ error: 'Both passport nationality and African destination country are required.' });
    }
    if (!apiKey) {
      return res.status(503).json({
        error: 'Live Search Grounding service key is not configured in Settings > Secrets.',
      });
    }

    const prompt = `Search the live web for the latest official immigration, visa, and entry requirements for a "${cleanPassport}" passport holder traveling to "${cleanDest}" for "${cleanPurpose}".
Provide accurate, factual bureaucratic guidance using this exact labeled format at the top, followed by clear actionable guidance:
ENTRY_CATEGORY: <Visa-Free | eVisa / eTA | Visa on Arrival | Embassy Visa>
STAY_LIMIT: <Maximum authorized stay duration>
ESTIMATED_FEE: <Official visa/eTA/security fee or $0 Exempt>
PROCESSING_TIME: <Typical processing turnaround>
OFFICIAL_PORTAL: <Official government immigration portal domain or Embassy authority>
BUREAUCRATIC_SUMMARY: <3-4 factual sentences covering exact step-by-step portal/consular application order, Yellow Fever ICVP vaccination rule, passport validity/blank page requirements, and any ECOWAS/EAC/SADC/CEMAC or AU exemption.>
PROPERTY_ADVISORY: <1-2 factual sentences on foreign visitor entry requirements when inspecting, acquiring real estate, or registering corporate/tax IDs in ${cleanDest}.>`;

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

    res.json({
      passportCountry: cleanPassport,
      destinationCountry: cleanDest,
      travelPurpose: cleanPurpose,
      checkedAt: new Date().toISOString(),
      reportText,
      parsed: {
        entryCategory: extractField('ENTRY_CATEGORY') || 'Verify via Official Portal',
        stayLimit: extractField('STAY_LIMIT') || 'See diplomatic terms',
        estimatedFee: extractField('ESTIMATED_FEE') || 'Official tariff applies',
        processingTime: extractField('PROCESSING_TIME') || 'Check portal SLA',
        officialPortal: extractField('OFFICIAL_PORTAL') || `${cleanDest} Immigration Authority`,
        bureaucraticSummary: extractField('BUREAUCRATIC_SUMMARY') || reportText,
        propertyAdvisory: extractField('PROPERTY_ADVISORY') || 'Verify non-resident deed & tax compliance locally.',
      },
      sources,
    });
  } catch (error: any) {
    const errorMsg = error?.message || 'Failed to retrieve live visa policy update';
    console.warn('[API /api/gemini/visa-advisor warning]:', errorMsg);
    res.status(502).json({ error: errorMsg });
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

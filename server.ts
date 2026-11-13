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

// Enable JSON parsing with large body support for image/video base64 frames
app.use(express.json({ limit: '50mb' }));

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

// Model normalizer ensuring only active, supported models are called
function mapModel(modelName?: string): string {
  if (!modelName) return 'gemini-2.5-flash';
  const lower = modelName.toLowerCase();
  if (lower.includes('live-translate')) return 'gemini-2.5-flash';
  if (lower.includes('transcribe-live')) return 'gemini-2.5-flash';
  if (lower.includes('live')) return 'gemini-2.5-flash';
  if (lower.includes('tts')) return 'gemini-2.5-flash';
  if (lower.includes('pro')) return 'gemini-2.5-pro';
  if (lower.includes('imagen')) return 'imagen-3.0-generate-002';
  return 'gemini-2.5-flash';
}

function sanitizeConfig(config: any = {}) {
  const clean = { ...config };
  if (clean.thinkingConfig?.thinkingBudget) {
    delete clean.thinkingConfig.thinkingBudget;
  }
  return clean;
}

// 1. Generate content (Text, Structured JSON, Multimodal analysis, Audio/TTS, Search Grounding)
app.post('/api/gemini/generate', async (req, res) => {
  try {
    const { model, contents, config } = req.body;
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
    const { model, message, history, systemInstruction, config } = req.body;
    const targetModel = mapModel(model);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    let contents: any;
    if (Array.isArray(history) && history.length > 0) {
      const parts: any[] = [];
      if (systemInstruction) {
        parts.push({ text: `System Instruction:\n${systemInstruction}\n\n` });
      }
      for (const h of history) {
        parts.push({ text: `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.text || h.content}` });
      }
      parts.push({ text: `User: ${message}` });
      contents = [{ parts }];
    } else if (systemInstruction) {
      contents = [
        { parts: [{ text: `System Instruction:\n${systemInstruction}\n\nUser: ${message}` }] }
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
      const text = chunk.text || '';
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('[API /api/gemini/chat-stream error]:', error);
    res.write(`data: ${JSON.stringify({ error: error.message || 'Streaming failed' })}\n\n`);
    res.end();
  }
});

// 3. Image Generation
app.post('/api/gemini/generate-images', async (req, res) => {
  try {
    const { prompt, model, config } = req.body;
    const targetModel = model || 'imagen-3.0-generate-002';
    const response = await ai.models.generateImages({
      model: targetModel,
      prompt,
      config,
    });
    res.json(response);
  } catch (error: any) {
    console.error('[API /api/gemini/generate-images error]:', error);
    res.status(500).json({ error: error.message || 'Image generation failed' });
  }
});

// 4. Video Generation & Operations
app.post('/api/gemini/generate-videos', async (req, res) => {
  try {
    const { prompt, model, config } = req.body;
    const targetModel = model || 'veo-3.1-fast-generate-preview';
    const operation = await ai.models.generateVideos({
      model: targetModel,
      prompt,
      config,
    });
    res.json(operation);
  } catch (error: any) {
    console.error('[API /api/gemini/generate-videos error]:', error);
    res.status(500).json({ error: error.message || 'Video generation failed' });
  }
});

app.post('/api/gemini/get-videos-operation', async (req, res) => {
  try {
    const { operation } = req.body;
    const updatedOperation = await ai.operations.getVideosOperation({ operation });
    res.json(updatedOperation);
  } catch (error: any) {
    console.error('[API /api/gemini/get-videos-operation error]:', error);
    res.status(500).json({ error: error.message || 'Failed to poll video operation' });
  }
});

// 5. Video Secure Proxy (avoids leaking API key to client)
app.get('/api/gemini/video-proxy', async (req, res) => {
  try {
    const { uri } = req.query;
    if (!uri || typeof uri !== 'string') {
      return res.status(400).send('Missing uri query parameter');
    }
    const fetchUrl = `${uri}&key=${apiKey}`;
    const videoRes = await fetch(fetchUrl);
    const contentType = videoRes.headers.get('content-type') || 'video/mp4';
    res.setHeader('Content-Type', contentType);
    const buffer = await videoRes.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (error: any) {
    console.error('[API /api/gemini/video-proxy error]:', error);
    res.status(500).send('Failed to proxy video');
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

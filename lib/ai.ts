import { GoogleGenAI as GeminiAI, Type, Modality } from '@google/genai';
import type { Blob } from '@google/genai';

export { Type, Modality };
export type { Blob };
export type Chat = any;

type ContentRequest = { model: string; contents: unknown; config?: Record<string, any> };

const env = import.meta.env;
const gatewayUrl = env.VITE_AI_GATEWAY_URL?.replace(/\/$/, '');
const openRouterKey = env.VITE_OPENROUTER_API_KEY;
const geminiKey = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY;

const routerModel = (model: string) => {
  if (model.includes('pro')) return 'google/gemini-2.5-pro';
  return 'google/gemini-2.5-flash';
};

const textFromContents = (contents: any): string => {
  if (typeof contents === 'string') return contents;
  const values = Array.isArray(contents) ? contents : [contents];
  return values.flatMap((value) => {
    if (typeof value === 'string') return [value];
    if (value?.parts) return value.parts.map((part: any) => part.text).filter(Boolean);
    return [value?.text].filter(Boolean);
  }).join('\n');
};

const openRouterGenerate = async (request: ContentRequest) => {
  const response = await fetch(`${gatewayUrl || 'https://openrouter.ai/api/v1'}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(openRouterKey ? { Authorization: `Bearer ${openRouterKey}` } : {}),
      'HTTP-Referer': window.location.origin,
      'X-Title': 'AfriEstate',
    },
    body: JSON.stringify({
      model: routerModel(request.model),
      messages: [
        ...(request.config?.systemInstruction ? [{ role: 'system', content: request.config.systemInstruction }] : []),
        { role: 'user', content: textFromContents(request.contents) },
      ],
    }),
  });
  if (!response.ok) throw new Error(`OpenRouter request failed (${response.status}).`);
  const payload = await response.json();
  const text = payload.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text.trim()) throw new Error('OpenRouter returned an empty response.');
  return { text };
};

/**
 * The only AI entry point used by the UI. Text generation goes through the
 * configured OpenRouter gateway first and falls back to Gemini for continuity.
 * Set VITE_AI_GATEWAY_URL in production; it keeps provider credentials off the
 * browser. Direct VITE_* keys are supported only for local development.
 */
export class GoogleGenAI {
  private readonly gemini?: GeminiAI;
  readonly models: any;
  readonly chats: any;
  readonly live: any;
  readonly operations: any;

  constructor({ apiKey }: { apiKey?: string } = {}) {
    const resolvedGeminiKey = geminiKey || apiKey;
    this.gemini = resolvedGeminiKey ? new GeminiAI({ apiKey: resolvedGeminiKey }) : undefined;
    this.models = {
      generateContent: (request: ContentRequest) => this.generateContent(request),
      // Gemini-only modalities remain available through the same provider
      // boundary while OpenRouter handles all portable text workloads.
      generateImages: (request: any) => this.requireGemini().models.generateImages(request),
      generateVideos: (request: any) => this.requireGemini().models.generateVideos(request),
    };
    this.chats = {
      create: ({ model, config }: { model: string; config?: { systemInstruction?: string } }) => {
        const history: Array<{ role: string; text: string }> = [];
        return {
          sendMessageStream: async ({ message }: { message: string }) => {
            const context = history.map(({ role, text }) => `${role}: ${text}`).join('\n');
            const response = await this.generateContent({
              model,
              contents: `${config?.systemInstruction ? `System instructions:\n${config.systemInstruction}\n\n` : ''}${context}\nUser: ${message}`,
            });
            history.push({ role: 'user', text: message }, { role: 'assistant', text: response.text });
            return (async function* () { yield response; })();
          },
        };
      },
    };
    this.live = this.gemini?.live;
    this.operations = this.gemini?.operations;
  }

  private requireGemini() {
    if (!this.gemini) throw new Error('Gemini is not configured. Set VITE_GEMINI_API_KEY or configure the AI gateway.');
    return this.gemini;
  }

  private async generateContent(request: ContentRequest) {
    // A gateway is intentionally considered configured without a browser key.
    if (gatewayUrl || openRouterKey) {
      try {
        return await openRouterGenerate(request);
      } catch (error) {
        if (!this.gemini) throw error;
        console.warn('OpenRouter unavailable; falling back to Gemini.', error);
      }
    }
    return this.requireGemini().models.generateContent(request as any);
  }
}

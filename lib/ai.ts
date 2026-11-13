// Client-side AI boundary.
// All Gemini API calls run securely through the application server (/api/gemini/* and /api/live).
// The client never imports @google/genai or handles API keys directly.

export enum Type {
  TYPE_UNSPECIFIED = "TYPE_UNSPECIFIED",
  STRING = "STRING",
  NUMBER = "NUMBER",
  INTEGER = "INTEGER",
  BOOLEAN = "BOOLEAN",
  ARRAY = "ARRAY",
  OBJECT = "OBJECT",
  NULL = "NULL",
}

export enum Modality {
  MODALITY_UNSPECIFIED = "MODALITY_UNSPECIFIED",
  TEXT = "TEXT",
  IMAGE = "IMAGE",
  AUDIO = "AUDIO",
  VIDEO = "VIDEO",
}

export interface Blob {
  data: string;
  mimeType: string;
}

export interface LiveSession {
  sendRealtimeInput: (input: { audio?: any; video?: any; text?: any; media?: any }) => void;
  close: () => void;
}

export interface LiveConnectOptions {
  model?: string;
  config?: Record<string, any>;
  callbacks?: {
    onopen?: () => void;
    onmessage?: (message: any) => void;
    onerror?: (error: any) => void;
    onclose?: (event?: any) => void;
  };
}

export class GenerateContentResponse {
  readonly text: string;
  readonly candidates: any[];

  constructor(data: { text?: string; candidates?: any[] }) {
    this.text = data.text || '';
    this.candidates = data.candidates || [];
  }
}

export class GoogleGenAI {
  readonly models: {
    generateContent: (request: { model?: string; contents: any; config?: any }) => Promise<GenerateContentResponse>;
    generateImages: (request: { model?: string; prompt: string; config?: any }) => Promise<any>;
    generateVideos: (request: { model?: string; prompt: string; config?: any }) => Promise<any>;
  };

  readonly chats: {
    create: (options?: { model?: string; config?: { systemInstruction?: string; [key: string]: any } }) => {
      sendMessageStream: ({ message }: { message: string }) => Promise<AsyncGenerator<{ text: string }, void, unknown>>;
    };
  };

  readonly operations: {
    getVideosOperation: ({ operation }: { operation: any }) => Promise<any>;
  };

  readonly live: {
    connect: (options: LiveConnectOptions) => Promise<LiveSession>;
  };

  constructor(_options: { apiKey?: string } = {}) {
    this.models = {
      generateContent: async ({ model, contents, config }) => {
        const response = await fetch('/api/gemini/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, contents, config }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Server generateContent failed with status ${response.status}`);
        }

        const data = await response.json();
        return new GenerateContentResponse(data);
      },

      generateImages: async ({ model, prompt, config }) => {
        const response = await fetch('/api/gemini/generate-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, prompt, config }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Server image generation failed with status ${response.status}`);
        }

        return response.json();
      },

      generateVideos: async ({ model, prompt, config }) => {
        const response = await fetch('/api/gemini/generate-videos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, prompt, config }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Server video generation failed with status ${response.status}`);
        }

        return response.json();
      },
    };

    this.operations = {
      getVideosOperation: async ({ operation }) => {
        const response = await fetch('/api/gemini/get-videos-operation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operation }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to fetch video operation with status ${response.status}`);
        }

        return response.json();
      },
    };

    this.chats = {
      create: (chatOptions = {}) => {
        const history: Array<{ role: string; content: string }> = [];

        return {
          sendMessageStream: async ({ message }: { message: string }) => {
            const response = await fetch('/api/gemini/chat-stream', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: chatOptions.model,
                message,
                history,
                systemInstruction: chatOptions.config?.systemInstruction,
                config: chatOptions.config,
              }),
            });

            if (!response.ok) {
              throw new Error(`Chat stream failed with status ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
              throw new Error('Streaming response body is unavailable');
            }

            let accumulatedText = '';
            const decoder = new TextDecoder();

            return (async function* () {
              let buffer = '';

              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                  const trimmed = line.trim();
                  if (!trimmed.startsWith('data:')) continue;
                  const dataStr = trimmed.slice(5).trim();

                  if (dataStr === '[DONE]') {
                    history.push({ role: 'user', content: message });
                    history.push({ role: 'assistant', content: accumulatedText });
                    return;
                  }

                  try {
                    const parsed = JSON.parse(dataStr);
                    if (parsed.error) {
                      throw new Error(parsed.error);
                    }
                    if (parsed.text) {
                      accumulatedText += parsed.text;
                      yield { text: parsed.text };
                    }
                  } catch (e: any) {
                    if (e.message && e.message !== 'Unexpected end of JSON input') {
                      throw e;
                    }
                  }
                }
              }

              if (accumulatedText) {
                history.push({ role: 'user', content: message });
                history.push({ role: 'assistant', content: accumulatedText });
              }
            })();
          },
        };
      },
    };

    this.live = {
      connect: async (options: LiveConnectOptions): Promise<LiveSession> => {
        return new Promise((resolve, reject) => {
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          const wsUrl = `${protocol}//${window.location.host}/api/live`;

          const ws = new WebSocket(wsUrl);

          const session: LiveSession = {
            sendRealtimeInput: (input) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(input));
              }
            },
            close: () => {
              try {
                ws.close();
              } catch (e) {
                // ignore
              }
            },
          };

          ws.onopen = () => {
            options.callbacks?.onopen?.();
            resolve(session);
          };

          ws.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              if (data.type === 'open') {
                options.callbacks?.onopen?.();
              } else if (data.type === 'error') {
                options.callbacks?.onerror?.(new Error(data.error || 'Live API error'));
              } else if (data.type === 'close') {
                options.callbacks?.onclose?.();
              } else {
                options.callbacks?.onmessage?.(data);
              }
            } catch (err) {
              console.error('Failed to parse Live message:', err);
            }
          };

          ws.onerror = (event) => {
            options.callbacks?.onerror?.(event);
            reject(event);
          };

          ws.onclose = (event) => {
            options.callbacks?.onclose?.(event);
          };
        });
      },
    };
  }
}

export type Chat = ReturnType<GoogleGenAI['chats']['create']>;

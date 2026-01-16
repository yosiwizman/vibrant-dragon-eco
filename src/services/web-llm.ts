"use client";

// Model configurations - v2.1
const MODELS = {
  mobile: 'Llama-3.2-1B-Instruct-q4f16_1-MLC', // 1.5GB - for phones
  desktop: 'Llama-3.2-3B-Instruct-q4f16_1-MLC', // 3GB - for computers
};

// Dynamic import types
type MLCEngine = any;

class WebLLMService {
  private engine: MLCEngine = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  private downloadProgress = 0;
  private progressCallbacks: Set<(progress: number) => void> = new Set();

  private isMobile(): boolean {
    return /iPhone|iPad|Android/i.test(navigator.userAgent);
  }

  private getModelId(): string {
    return this.isMobile() ? MODELS.mobile : MODELS.desktop;
  }

  async isModelCached(): Promise<boolean> {
    try {
      const modelId = this.getModelId();
      const { hasModelInCache } = await import('@mlc-ai/web-llm');
      return await hasModelInCache(modelId);
    } catch (error) {
      console.warn('[WebLLM] Failed to check model cache:', error);
      return false;
    }
  }

  onProgress(callback: (progress: number) => void) {
    this.progressCallbacks.add(callback);
    return () => {
      this.progressCallbacks.delete(callback);
    };
  }

  private notifyProgress(progress: number) {
    this.downloadProgress = progress;
    this.progressCallbacks.forEach(cb => cb(progress));
  }

  async initialize(progressCallback?: (progress: number) => void): Promise<void> {
    if (this.isInitialized && this.engine) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
        const modelId = this.getModelId();

        this.engine = await CreateMLCEngine(modelId, {
          initProgressCallback: (progress) => {
            const match = progress.text.match(/(\d+)%/);
            if (match) {
              const percent = parseInt(match[1]);
              this.notifyProgress(percent);
              if (progressCallback) {
                progressCallback(percent / 100);
              }
            }
          },
        });

        this.isInitialized = true;
        this.notifyProgress(100);
      } catch (error) {
        this.initPromise = null;
        throw error;
      }
    })();

    return this.initPromise;
  }

  async generate(prompt: string): Promise<string> {
    if (!this.engine) {
      await this.initialize();
    }

    if (!this.engine) {
      throw new Error('WebLLM engine not available');
    }

    try {
      const response = await this.engine.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 512,
        temperature: 0.7,
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      throw error;
    }
  }

  async chat(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    options?: { enableTools?: boolean; userId?: string }
  ): Promise<string> {
    if (!this.engine) {
      await this.initialize();
    }

    if (!this.engine) {
      throw new Error('WebLLM engine not available');
    }

    try {
      if (options?.enableTools) {
        const toolInstructions = `
You have access to these tools via JSON commands:
- add_widget: Add widgets to dashboard
- remove_widget: Remove widgets
- navigate_to: Navigate to pages
- create_task: Create tasks
- create_reminder: Set reminders
- web_search: Search the web (via DuckDuckGo, no API key needed)

Respond with JSON when using tools:
\`\`\`json
{"tool": "tool_name", "parameters": {...}}
\`\`\`
`;
        messages = [
          ...messages.slice(0, 1),
          { role: "system", content: toolInstructions },
          ...messages.slice(1),
        ];
      }

      const response = await this.engine.chat.completions.create({
        messages,
        max_tokens: 512,
        temperature: 0.7,
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      throw error;
    }
  }

  async clearCache(): Promise<void> {
    try {
      const modelId = this.getModelId();
      
      if (this.engine) {
        this.engine = null;
        this.isInitialized = false;
        this.initPromise = null;
      }

      const cacheKey = `webllm/model/${modelId}`;
      await caches.delete(cacheKey);
      
      if ('indexedDB' in window) {
        const dbs = await indexedDB.databases();
        for (const db of dbs) {
          if (db.name?.includes('webllm') || db.name?.includes(modelId)) {
            indexedDB.deleteDatabase(db.name);
          }
        }
      }
    } catch (error: any) {
      throw new Error('Failed to remove local AI model');
    }
  }

  async unload() {
    if (this.engine) {
      this.engine = null;
      this.isInitialized = false;
      this.initPromise = null;
    }
  }

  getStatus(): {
    isInitialized: boolean;
    downloadProgress: number;
    modelId: string;
  } {
    return {
      isInitialized: this.isInitialized,
      downloadProgress: this.downloadProgress,
      modelId: this.getModelId(),
    };
  }
}

// Create singleton instance - only declared once
let webLLMInstance: WebLLMService | null = null;

export function getWebLLM(): WebLLMService {
  if (!webLLMInstance) {
    webLLMInstance = new WebLLMService();
  }
  return webLLMInstance;
}

// Export singleton for backward compatibility
export const webLLM = getWebLLM();

export function isWebLLMSupported(): boolean {
  return 'gpu' in navigator;
}

export function getModelSize(): string {
  const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
  return isMobile ? '1.5GB' : '3GB';
}
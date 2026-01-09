"use client";

import { CreateMLCEngine, MLCEngine, hasModelInCache } from '@mlc-ai/web-llm';

// Model configurations - v2.0 (cache bust)
const MODELS = {
  mobile: 'Llama-3.2-1B-Instruct-q4f16_1-MLC', // 1.5GB - for phones
  desktop: 'Llama-3.2-3B-Instruct-q4f16_1-MLC', // 3GB - for computers
};

class WebLLMService {
  private engine: MLCEngine | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  private downloadProgress = 0;
  private progressCallbacks: Set<(progress: number) => void> = new Set();

  /**
   * Check if running on mobile device
   */
  private isMobile(): boolean {
    return /iPhone|iPad|Android/i.test(navigator.userAgent);
  }

  /**
   * Get appropriate model for device
   */
  private getModelId(): string {
    return this.isMobile() ? MODELS.mobile : MODELS.desktop;
  }

  /**
   * Check if model is already cached
   */
  async isModelCached(): Promise<boolean> {
    const modelId = this.getModelId();
    return await hasModelInCache(modelId);
  }

  /**
   * Subscribe to download progress
   */
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

  /**
   * Initialize the WebLLM engine
   */
  async initialize(): Promise<void> {
    // If already initialized, return
    if (this.isInitialized && this.engine) {
      return;
    }

    // If initialization in progress, wait for it
    if (this.initPromise) {
      return this.initPromise;
    }

    // Start initialization
    this.initPromise = (async () => {
      try {
        const modelId = this.getModelId();
        const cached = await this.isModelCached();

        console.log('[WebLLM] Initializing...', { modelId, cached });

        this.engine = await CreateMLCEngine(modelId, {
          initProgressCallback: (progress) => {
            console.log('[WebLLM] Progress:', progress);
            // Extract percentage from progress text
            const match = progress.text.match(/(\d+)%/);
            if (match) {
              this.notifyProgress(parseInt(match[1]));
            }
          },
        });

        this.isInitialized = true;
        this.notifyProgress(100);
        console.log('[WebLLM] Initialized successfully');
      } catch (error) {
        console.error('[WebLLM] Initialization failed:', error);
        this.initPromise = null;
        throw error;
      }
    })();

    return this.initPromise;
  }

  /**
   * Generate response from prompt
   */
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
      console.error('[WebLLM] Generation failed:', error);
      throw error;
    }
  }

  /**
   * Chat with conversation history
   */
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
      // Add tool instructions if enabled
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
      console.error('[WebLLM] Chat failed:', error);
      throw error;
    }
  }

  /**
   * Clear cached model to free storage
   */
  async clearCache(): Promise<void> {
    try {
      const modelId = this.getModelId();
      
      // Unload engine first
      if (this.engine) {
        this.engine = null;
        this.isInitialized = false;
        this.initPromise = null;
      }

      // Clear from cache
      const cacheKey = `webllm/model/${modelId}`;
      await caches.delete(cacheKey);
      
      // Also try to clear IndexedDB if used
      if ('indexedDB' in window) {
        const dbs = await indexedDB.databases();
        for (const db of dbs) {
          if (db.name?.includes('webllm') || db.name?.includes(modelId)) {
            indexedDB.deleteDatabase(db.name);
          }
        }
      }
      
      console.log('[WebLLM] Cache cleared successfully');
    } catch (error: any) {
      console.error('[WebLLM] Failed to clear cache:', error);
      throw new Error('Failed to remove local AI model');
    }
  }

  /**
   * Unload model to free memory
   */
  async unload() {
    if (this.engine) {
      // WebLLM doesn't have explicit unload, but we can null the reference
      this.engine = null;
      this.isInitialized = false;
      this.initPromise = null;
      console.log('[WebLLM] Model unloaded');
    }
  }

  /**
   * Get current status
   */
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

// Singleton instance
export const webLLM = new WebLLMService();

// Check if WebLLM is supported
export function isWebLLMSupported(): boolean {
  // Check for WebGPU support
  return 'gpu' in navigator;
}

// Get estimated model size
export function getModelSize(): string {
  const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
  return isMobile ? '1.5GB' : '3GB';
}
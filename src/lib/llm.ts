import OpenAI from 'openai';
import { type Config } from './config';

export type LLMProvider = 'ollama' | 'openai';
export type ModelInfo = {
  id: string;
  name: string;
  provider: LLMProvider;
  contextLength: number;
  parameters?: string;
  installed?: boolean;
};

export class LLMService {
  private config: Config;
  private openai: OpenAI | null = null;
  private initialized = false;

  constructor(config: Config) {
    this.config = config;
    this.initializeClients();
  }

  private async initializeClients() {
    if (this.initialized) return;

    if (this.config.openai.enabled && this.config.openai.apiKey) {
      this.openai = new OpenAI({
        apiKey: this.config.openai.apiKey,
        dangerouslyAllowBrowser: true,
      });
    }

    // Test Ollama connection if enabled
    if (this.config.ollama.enabled) {
      try {
        const response = await fetch(`${this.config.ollama.apiUrl}/api/version`);
        if (!response.ok) {
          console.warn('Ollama service is not accessible');
        }
      } catch (error) {
        console.warn('Failed to connect to Ollama:', error);
      }
    }

    this.initialized = true;
  }

  async updateConfig(newConfig: Config) {
    this.config = newConfig;
    this.initialized = false;
    await this.initializeClients();
  }

  async testConnection(provider: LLMProvider): Promise<{ ok: boolean; version?: string; error?: string }> {
    try {
      if (provider === 'ollama') {
        if (!this.config.ollama.enabled) {
          return { ok: false, error: 'Ollama is not enabled' };
        }

        const response = await fetch(`${this.config.ollama.apiUrl}/api/version`, {
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return { ok: true, version: data.version };
      } 
      
      if (provider === 'openai') {
        if (!this.config.openai.enabled) {
          return { ok: false, error: 'OpenAI is not enabled' };
        }
        if (!this.config.openai.apiKey) {
          return { ok: false, error: 'OpenAI API key is not set' };
        }
        if (!this.openai) {
          return { ok: false, error: 'OpenAI client is not initialized' };
        }
        
        const models = await this.openai.models.list();
        return { 
          ok: true, 
          version: `Available models: ${models.data.length}` 
        };
      }

      return { ok: false, error: 'Invalid provider' };
    } catch (error) {
      console.error(`Error testing ${provider} connection:`, error);
      return { 
        ok: false, 
        error: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  }

  async listModels(provider: LLMProvider): Promise<ModelInfo[]> {
    if (!this.initialized) {
      await this.initializeClients();
    }

    try {
      if (provider === 'ollama' && this.config.ollama.enabled) {
        const response = await fetch(`${this.config.ollama.apiUrl}/api/tags`, {
          signal: AbortSignal.timeout(5000),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return (data.models || []).map((model: any) => ({
          id: model.digest,
          name: model.name,
          provider: 'ollama' as const,
          contextLength: 4096,
          parameters: `${(model.size / (1024 * 1024 * 1024)).toFixed(1)}GB`,
          installed: true,
        }));
      }

      if (provider === 'openai' && this.openai && this.config.openai.enabled) {
        const models = await this.openai.models.list();
        return models.data.map(model => ({
          id: model.id,
          name: model.id,
          provider: 'openai' as const,
          contextLength: model.context_window || 4096,
          installed: true,
        }));
      }

      return [];
    } catch (error) {
      console.error(`Error fetching ${provider} models:`, error);
      return [];
    }
  }

  // Rest of the class implementation remains the same
  // ... (generateResponse, pullModel methods)
}
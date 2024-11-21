import { useState, useEffect, useCallback } from 'react';
import { LLMService, type LLMProvider, type ModelInfo } from '../lib/llm';
import { type Config, defaultConfig } from '../lib/config';

export function useLLM() {
  const [config, setConfig] = useState<Config>(() => {
    const savedConfig = localStorage.getItem('llm-config');
    if (savedConfig) {
      try {
        return JSON.parse(savedConfig);
      } catch (e) {
        console.warn('Failed to parse saved config:', e);
      }
    }
    return defaultConfig;
  });

  const [llmService] = useState(() => new LLMService(config));
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadModels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.allSettled([
        config.ollama.enabled ? llmService.listModels('ollama') : Promise.resolve([]),
        config.openai.enabled ? llmService.listModels('openai') : Promise.resolve([]),
      ]);

      const allModels = results.reduce<ModelInfo[]>((acc, result) => {
        if (result.status === 'fulfilled') {
          return [...acc, ...result.value];
        }
        return acc;
      }, []);

      setModels(allModels);

      // Check if we have any rejected promises and set error accordingly
      const errors = results
        .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
        .map(r => r.reason?.message || 'Failed to load models');

      if (errors.length > 0) {
        setError(errors.join(', '));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load models');
    } finally {
      setLoading(false);
    }
  }, [config.ollama.enabled, config.openai.enabled]);

  useEffect(() => {
    localStorage.setItem('llm-config', JSON.stringify(config));
    llmService.updateConfig(config).then(() => loadModels());
  }, [config]);

  const updateConfig = useCallback((newConfig: Partial<Config>) => {
    setConfig(prev => ({
      ...prev,
      ...newConfig,
    }));
  }, []);

  return {
    config,
    models,
    loading,
    error,
    updateConfig,
    testConnection: (provider: LLMProvider) => llmService.testConnection(provider),
    generateResponse: (prompt: string, model: string) => llmService.generateResponse(prompt, model),
    pullModel: (modelName: string, onProgress: (progress: string) => void) => 
      llmService.pullModel(modelName, onProgress),
    refresh: loadModels,
  };
}
import React, { useState, useEffect } from 'react';
import { Server, Key, Activity, CheckCircle, AlertTriangle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useLLM } from '../../hooks/useLLM';

export function SettingsTab() {
  const { config, updateConfig, testConnection } = useLLM();
  const [ollamaStatus, setOllamaStatus] = useState<{ ok: boolean; version?: string; error?: string } | null>(null);
  const [openAIStatus, setOpenAIStatus] = useState<{ ok: boolean; version?: string; error?: string } | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState<'ollama' | 'openai' | null>(null);

  const checkOllamaConnection = async () => {
    setIsTesting('ollama');
    try {
      const status = await testConnection('ollama');
      setOllamaStatus(status);
    } catch (error) {
      setOllamaStatus({ 
        ok: false, 
        error: error instanceof Error ? error.message : 'Connection failed' 
      });
    }
    setIsTesting(null);
  };

  const checkOpenAIConnection = async () => {
    setIsTesting('openai');
    try {
      const status = await testConnection('openai');
      setOpenAIStatus(status);
    } catch (error) {
      setOpenAIStatus({ 
        ok: false, 
        error: error instanceof Error ? error.message : 'Connection failed' 
      });
    }
    setIsTesting(null);
  };

  const handleOllamaToggle = (enabled: boolean) => {
    updateConfig({
      ollama: { ...config.ollama, enabled }
    });
    if (enabled) {
      checkOllamaConnection();
    } else {
      setOllamaStatus(null);
    }
  };

  const handleOpenAIToggle = (enabled: boolean) => {
    updateConfig({
      openai: { ...config.openai, enabled }
    });
    if (enabled && config.openai.apiKey) {
      checkOpenAIConnection();
    } else {
      setOpenAIStatus(null);
    }
  };

  useEffect(() => {
    if (config.ollama.enabled) {
      checkOllamaConnection();
    }
    if (config.openai.enabled && config.openai.apiKey) {
      checkOpenAIConnection();
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Ollama Settings */}
      <div className="bg-zinc-900 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Server className="h-6 w-6 text-yellow-400" />
            <h2 className="text-xl font-bold text-white">Ollama</h2>
          </div>
          <div className="flex items-center space-x-3">
            {isTesting === 'ollama' ? (
              <Activity className="h-5 w-5 text-yellow-400 animate-spin" />
            ) : ollamaStatus?.ok ? (
              <CheckCircle className="h-5 w-5 text-green-400" />
            ) : ollamaStatus ? (
              <AlertTriangle className="h-5 w-5 text-red-400" />
            ) : null}
            <button
              onClick={checkOllamaConnection}
              disabled={isTesting === 'ollama' || !config.ollama.enabled}
              className="flex items-center space-x-2 px-3 py-1.5 bg-yellow-400 text-black rounded-lg hover:bg-yellow-300 transition-colors text-sm disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isTesting === 'ollama' ? 'animate-spin' : ''}`} />
              <span>Test Connection</span>
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={config.ollama.enabled}
                onChange={(e) => handleOllamaToggle(e.target.checked)}
              />
              <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div>
              <span className="ms-3 text-sm font-medium text-white">Enable Ollama</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300">API Endpoint</label>
            <input
              type="text"
              value={config.ollama.apiUrl}
              onChange={(e) => updateConfig({
                ollama: { ...config.ollama, apiUrl: e.target.value }
              })}
              disabled={!config.ollama.enabled}
              className="mt-1 block w-full rounded-lg bg-black border-zinc-700 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-50"
            />
          </div>

          {ollamaStatus && (
            <div className={`text-sm ${ollamaStatus.ok ? 'text-green-400' : 'text-red-400'}`}>
              {ollamaStatus.ok ? (
                `Connected successfully (version ${ollamaStatus.version})`
              ) : (
                `Connection failed: ${ollamaStatus.error}`
              )}
            </div>
          )}
        </div>
      </div>

      {/* OpenAI Settings */}
      <div className="bg-zinc-900 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Key className="h-6 w-6 text-yellow-400" />
            <h2 className="text-xl font-bold text-white">OpenAI</h2>
          </div>
          <div className="flex items-center space-x-3">
            {isTesting === 'openai' ? (
              <Activity className="h-5 w-5 text-yellow-400 animate-spin" />
            ) : openAIStatus?.ok ? (
              <CheckCircle className="h-5 w-5 text-green-400" />
            ) : openAIStatus ? (
              <AlertTriangle className="h-5 w-5 text-red-400" />
            ) : null}
            <button
              onClick={checkOpenAIConnection}
              disabled={isTesting === 'openai' || !config.openai.enabled || !config.openai.apiKey}
              className="flex items-center space-x-2 px-3 py-1.5 bg-yellow-400 text-black rounded-lg hover:bg-yellow-300 transition-colors text-sm disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isTesting === 'openai' ? 'animate-spin' : ''}`} />
              <span>Test Connection</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={config.openai.enabled}
                onChange={(e) => handleOpenAIToggle(e.target.checked)}
              />
              <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div>
              <span className="ms-3 text-sm font-medium text-white">Enable OpenAI</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300">API Key</label>
            <div className="relative mt-1">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={config.openai.apiKey}
                onChange={(e) => updateConfig({
                  openai: { ...config.openai, apiKey: e.target.value }
                })}
                disabled={!config.openai.enabled}
                className="block w-full rounded-lg bg-black border-zinc-700 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-50"
                placeholder="sk-..."
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-zinc-400 hover:text-white"
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {openAIStatus && (
            <div className={`text-sm ${openAIStatus.ok ? 'text-green-400' : 'text-red-400'}`}>
              {openAIStatus.ok ? (
                `Connected successfully (${openAIStatus.version})`
              ) : (
                `Connection failed: ${openAIStatus.error}`
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => {
            if (config.ollama.enabled) checkOllamaConnection();
            if (config.openai.enabled && config.openai.apiKey) checkOpenAIConnection();
          }}
          className="px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-300 transition-colors"
        >
          Save & Test All Connections
        </button>
      </div>
    </div>
  );
}
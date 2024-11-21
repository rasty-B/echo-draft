import React, { useState, useEffect } from 'react';
import { Download, CheckCircle, XCircle, Activity, AlertTriangle, RefreshCw } from 'lucide-react';
import { testConnection, getModels, pullModel } from '../../lib/ollama';

type ConnectionStatus = {
  ok: boolean;
  version?: string;
  error?: string;
};

type Model = {
  name: string;
  size: number;
  digest: string;
  modified_at: string;
  status: 'ready' | 'pulling' | 'not-installed';
  pullProgress?: string;
};

const defaultModels = [
  { 
    name: 'llama2:3b', 
    size: 3_100_000_000,
    digest: 'default',
    modified_at: new Date().toISOString(),
    status: 'not-installed' as const
  },
  { 
    name: 'nomic-embed-text', 
    size: 1_500_000_000,
    digest: 'default',
    modified_at: new Date().toISOString(),
    status: 'not-installed' as const
  }
];

export function ModelsTab() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [models, setModels] = useState<Model[]>(defaultModels);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pullStatus, setPullStatus] = useState<Record<string, string>>({});

  const checkConnection = async () => {
    try {
      const status = await testConnection();
      setConnectionStatus(status);
      return status.ok;
    } catch (error) {
      setConnectionStatus({
        ok: false,
        error: 'Ollama service not detected. Please ensure Ollama is installed and running.'
      });
      return false;
    }
  };

  const loadModels = async () => {
    setLoading(true);
    try {
      const availableModels = await getModels();
      const updatedModels = defaultModels.map(defaultModel => {
        const found = availableModels.find(m => m.name === defaultModel.name);
        return found ? { ...found, status: 'ready' as const } : defaultModel;
      });
      setModels(updatedModels);
    } catch (error) {
      console.warn('Failed to load models, using defaults:', error);
      setModels(defaultModels);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const isConnected = await checkConnection();
      if (isConnected) {
        await loadModels();
      } else {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handlePull = async (modelName: string) => {
    if (!connectionStatus?.ok) {
      setPullStatus(prev => ({ 
        ...prev, 
        [modelName]: 'Cannot pull model: Ollama service not available' 
      }));
      return;
    }

    setPullStatus(prev => ({ ...prev, [modelName]: 'Starting download...' }));
    
    try {
      const success = await pullModel(modelName, (progress) => {
        setPullStatus(prev => ({ ...prev, [modelName]: progress }));
      });

      if (success) {
        await loadModels();
      }
    } catch (error) {
      console.error('Failed to pull model:', error);
      setPullStatus(prev => ({ 
        ...prev, 
        [modelName]: 'Failed to pull model. Please check Ollama service.' 
      }));
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!connectionStatus?.ok && !isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-yellow-400" />
            <h3 className="text-lg font-medium text-white">Ollama Service Not Detected</h3>
          </div>
          <p className="text-zinc-400 mb-4">
            To use this feature, please ensure Ollama is installed and running on your system.
          </p>
          <div className="space-y-2">
            <h4 className="font-medium text-white">Setup Instructions:</h4>
            <ol className="list-decimal list-inside space-y-2 text-zinc-400">
              <li>Install Ollama from <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:underline">ollama.ai</a></li>
              <li>Start the Ollama service</li>
              <li>Refresh this page</li>
            </ol>
          </div>
          <button
            onClick={checkConnection}
            className="mt-6 flex items-center space-x-2 px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-300 transition-colors"
          >
            <RefreshCw className="h-5 w-5" />
            <span>Retry Connection</span>
          </button>
        </div>

        <div className="grid gap-4">
          {models.map((model) => (
            <div key={model.name} className="bg-zinc-900 rounded-lg p-6 border border-zinc-800 opacity-75">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold text-white">{model.name}</h3>
                    <XCircle className="h-5 w-5 text-zinc-400" />
                  </div>
                  <div className="text-sm text-zinc-400 space-y-1">
                    <p>Size: {formatSize(model.size)}</p>
                    <p>Status: Not available (Ollama service required)</p>
                  </div>
                </div>
                <button
                  disabled
                  className="flex items-center space-x-2 px-4 py-2 bg-zinc-800 text-zinc-400 rounded-lg cursor-not-allowed"
                >
                  <Download className="h-5 w-5" />
                  <span>Pull Model</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
        <div className="flex items-center space-x-3">
          {isLoading ? (
            <Activity className="h-5 w-5 text-yellow-400 animate-spin" />
          ) : connectionStatus?.ok ? (
            <CheckCircle className="h-5 w-5 text-green-400" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-red-400" />
          )}
          <div>
            <h3 className="font-medium text-white">Ollama Connection Status</h3>
            <p className="text-sm text-zinc-400">
              {isLoading ? 'Checking connection...' :
               connectionStatus?.ok ? `Connected (v${connectionStatus.version})` :
               `Connection failed: ${connectionStatus?.error}`}
            </p>
          </div>
          {!connectionStatus?.ok && !isLoading && (
            <button
              onClick={checkConnection}
              className="ml-auto px-3 py-1.5 bg-yellow-400 text-black rounded hover:bg-yellow-300 transition-colors text-sm"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Retry Connection</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-8">
            <Activity className="h-8 w-8 text-yellow-400 animate-spin mx-auto" />
            <p className="mt-2 text-zinc-400">Loading models...</p>
          </div>
        ) : models.map((model) => (
          <div key={model.name} className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold text-white">{model.name}</h3>
                  {model.status === 'ready' ? (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  ) : model.status === 'pulling' ? (
                    <Activity className="h-5 w-5 text-yellow-400 animate-spin" />
                  ) : (
                    <XCircle className="h-5 w-5 text-zinc-400" />
                  )}
                </div>
                <div className="text-sm text-zinc-400 space-y-1">
                  <p>Size: {formatSize(model.size)}</p>
                  <p>Last Modified: {new Date(model.modified_at).toLocaleString()}</p>
                  {pullStatus[model.name] && (
                    <p className="text-yellow-400">{pullStatus[model.name]}</p>
                  )}
                </div>
              </div>
              {model.status !== 'ready' && (
                <button
                  onClick={() => handlePull(model.name)}
                  disabled={!!pullStatus[model.name]}
                  className="flex items-center space-x-2 px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-300 transition-colors disabled:opacity-50"
                >
                  <Download className="h-5 w-5" />
                  <span>{pullStatus[model.name] ? 'Pulling...' : 'Pull Model'}</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
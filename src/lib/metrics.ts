import { type SystemMetrics } from '../types';

const OLLAMA_API_URL = import.meta.env.VITE_OLLAMA_API_URL || 'http://localhost:11434';

export async function getSystemMetrics(): Promise<SystemMetrics> {
  try {
    // First check if Ollama is accessible
    const versionResponse = await fetch(`${OLLAMA_API_URL}/api/version`);
    if (!versionResponse.ok) {
      throw new Error('Ollama service is not accessible');
    }

    // Get GPU metrics from Ollama
    const gpuResponse = await fetch(`${OLLAMA_API_URL}/api/show`);
    const gpuData = await gpuResponse.json();
    
    // Parse GPU information if available
    const gpu = gpuData.nvidia?.gpu ? {
      name: gpuData.nvidia.gpu.name || 'NVIDIA GPU',
      memory: {
        used: gpuData.nvidia.gpu.memory.used * 1024 * 1024,
        total: gpuData.nvidia.gpu.memory.total * 1024 * 1024,
      },
      utilization: gpuData.nvidia.gpu.utilization || 0,
    } : undefined;

    // Get container logs with error handling
    let containerLogs: string[] = [];
    try {
      const logsResponse = await fetch(`${OLLAMA_API_URL}/api/logs`);
      if (logsResponse.ok) {
        const logsData = await logsResponse.json();
        containerLogs = logsData.logs || [];
      }
    } catch (error) {
      console.warn('Failed to fetch container logs:', error);
    }

    // Get system metrics
    const metrics = await navigator.storage.estimate();
    const memory = performance?.memory as any;

    return {
      cpu: Math.round(Math.random() * 30 + 20), // Simulated CPU usage
      memory: {
        used: memory?.usedJSHeapSize || 8 * 1024 * 1024 * 1024,
        total: memory?.jsHeapSizeLimit || 16 * 1024 * 1024 * 1024,
      },
      storage: {
        used: metrics.usage || 256 * 1024 * 1024 * 1024,
        total: metrics.quota || 512 * 1024 * 1024 * 1024,
      },
      gpu,
      containerLogs,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching system metrics:', error);
    // Return fallback metrics instead of throwing
    return {
      cpu: 0,
      memory: { used: 0, total: 16 * 1024 * 1024 * 1024 },
      storage: { used: 0, total: 512 * 1024 * 1024 * 1024 },
      timestamp: new Date().toISOString(),
    };
  }
}
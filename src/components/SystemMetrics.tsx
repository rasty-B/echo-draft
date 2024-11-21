import React from 'react';
import { Cpu, Database, HardDrive } from 'lucide-react';

export function SystemMetrics() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
        <div className="flex items-center space-x-3">
          <Cpu className="h-6 w-6 text-yellow-400" />
          <div>
            <h3 className="text-lg font-medium text-white">CPU Usage</h3>
            <div className="mt-2">
              <div className="w-full bg-black rounded-full h-2">
                <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>
              <p className="text-sm text-zinc-400 mt-1">45%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
        <div className="flex items-center space-x-3">
          <Database className="h-6 w-6 text-yellow-400" />
          <div>
            <h3 className="text-lg font-medium text-white">Memory Usage</h3>
            <div className="mt-2">
              <div className="w-full bg-black rounded-full h-2">
                <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '60%' }}></div>
              </div>
              <p className="text-sm text-zinc-400 mt-1">8GB / 16GB</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
        <div className="flex items-center space-x-3">
          <HardDrive className="h-6 w-6 text-yellow-400" />
          <div>
            <h3 className="text-lg font-medium text-white">Storage</h3>
            <div className="mt-2">
              <div className="w-full bg-black rounded-full h-2">
                <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
              <p className="text-sm text-zinc-400 mt-1">75GB / 100GB</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
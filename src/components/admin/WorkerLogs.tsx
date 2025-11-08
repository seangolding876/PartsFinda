// components/admin/WorkerLogs.tsx
'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Trash2, Download, Play, Square } from 'lucide-react';

interface WorkerLogsProps {
  authToken: string;
}

export default function WorkerLogs({ authToken }: WorkerLogsProps) {
  const [logs, setLogs] = useState('');
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [workerStatus, setWorkerStatus] = useState<'running' | 'stopped' | 'unknown'>('unknown');

  const fetchWorkerLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/pm2-logs/worker', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setLogs(data.logs);
      } else {
        setLogs('Error: ' + data.error);
      }
    } catch (error) {
      setLogs('Failed to fetch worker logs: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkerStatus = async () => {
    try {
      const response = await fetch('/api/admin/pm2-logs/worker/status', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setWorkerStatus(data.status);
      }
    } catch (error) {
      console.error('Failed to fetch worker status:', error);
    }
  };

  const controlWorker = async (action: 'start' | 'stop' | 'restart') => {
    try {
      const response = await fetch('/api/admin/pm2-logs/worker/control', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      });
      
      const data = await response.json();
      if (data.success) {
        fetchWorkerStatus();
        fetchWorkerLogs(); // Refresh logs
      } else {
        alert('Failed to control worker: ' + data.error);
      }
    } catch (error) {
      alert('Failed to control worker');
    }
  };

  const clearWorkerLogs = async () => {
    try {
      await fetch('/api/admin/pm2-logs/worker/clear', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      fetchWorkerLogs(); // Refresh logs
    } catch (error) {
      console.error('Failed to clear worker logs:', error);
    }
  };

  const downloadWorkerLogs = () => {
    const blob = new Blob([logs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `partsfinda-worker-logs-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchWorkerLogs();
    fetchWorkerStatus();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchWorkerLogs, 5000); // 5 seconds for worker logs
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-800';
      case 'stopped': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Worker Process Logs</h2>
          <p className="text-sm text-gray-600">partsfinda-worker</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Worker Status */}
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(workerStatus)}`}>
            Status: {workerStatus}
          </div>
          
          {/* Control Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={() => controlWorker('start')}
              className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
            >
              <Play className="w-3 h-3" />
              <span>Start</span>
            </button>
            
            <button
              onClick={() => controlWorker('stop')}
              className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
            >
              <Square className="w-3 h-3" />
              <span>Stop</span>
            </button>
            
            <button
              onClick={() => controlWorker('restart')}
              className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Restart</span>
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          <button
            onClick={fetchWorkerLogs}
            disabled={loading}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Logs</span>
          </button>

          <button
            onClick={downloadWorkerLogs}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>

          <button
            onClick={clearWorkerLogs}
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Logs</span>
          </button>
        </div>

        {/* Auto Refresh Toggle */}
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">Auto-refresh (5s)</span>
        </label>
      </div>

      {/* Logs Display */}
      <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-96 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading worker logs...</span>
          </div>
        ) : (
          <pre className="whitespace-pre-wrap">{logs}</pre>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500 flex justify-between">
        <span>Process: partsfinda-worker</span>
        <span>Last updated: {new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  );
}
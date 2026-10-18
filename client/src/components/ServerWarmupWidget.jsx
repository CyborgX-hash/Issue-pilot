import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api.js';
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  RefreshCw,
  Server,
  Zap,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export function ServerWarmupWidget() {
  const [status, setStatus] = useState('checking'); // 'checking' | 'ready' | 'error'
  const [healthData, setHealthData] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isExpanded, setIsExpanded] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const timerRef = useRef(null);
  const pollRef = useRef(null);

  const checkHealth = async () => {
    try {
      setStatus(prev => (prev === 'ready' ? 'ready' : 'checking'));
      const data = await api.getHealth();
      if (data && data.status === 'healthy') {
        setStatus('ready');
        setHealthData(data);
        if (pollRef.current) clearInterval(pollRef.current);
        if (timerRef.current) clearInterval(timerRef.current);
      } else {
        throw new Error('Server returned non-healthy response');
      }
    } catch (err) {
      // Free-tier render servers take 30-50s on cold start
      setStatus('checking');
      setRetryCount(c => c + 1);
    }
  };

  useEffect(() => {
    // Start elapsed seconds counter
    timerRef.current = setInterval(() => {
      setElapsedSeconds(s => s + 1);
    }, 1000);

    // Initial check
    checkHealth();

    // Poll every 3 seconds until healthy
    pollRef.current = setInterval(() => {
      checkHealth();
    }, 3000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleManualRefresh = () => {
    setStatus('checking');
    setElapsedSeconds(0);
    checkHealth();
  };

  return (
    <div
      className={`fixed right-3 sm:right-5 top-1/2 -translate-y-1/2 z-40 transition-all duration-300 ease-in-out ${
        isExpanded ? 'w-72 sm:w-80' : 'w-auto'
      }`}
    >
      <div className="relative bg-white/95 backdrop-blur-md border border-surface-200/90 rounded-xl shadow-lg hover:shadow-xl transition-shadow p-3.5 text-xs">
        {/* Toggle Collapse Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-surface-200 shadow-sm flex items-center justify-center text-ink-muted hover:text-ink-primary hover:bg-surface-50 transition-colors"
          title={isExpanded ? 'Collapse server status' : 'Expand server status'}
        >
          {isExpanded ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        {!isExpanded ? (
          // Collapsed Pill View
          <div
            onClick={() => setIsExpanded(true)}
            className="cursor-pointer flex items-center space-x-2 py-0.5 px-1 font-mono text-[11px]"
          >
            {status === 'ready' ? (
              <div className="flex items-center space-x-1.5 text-emerald-600 font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Live</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 text-amber-600">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                <span>{elapsedSeconds}s</span>
              </div>
            )}
          </div>
        ) : (
          // Expanded Detailed View
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-surface-100">
              <div className="flex items-center space-x-2">
                <Server className="w-4 h-4 text-ink-secondary" />
                <span className="font-semibold text-ink-primary tracking-tight">Render Server Status</span>
              </div>
              <button
                onClick={handleManualRefresh}
                className="text-ink-muted hover:text-ink-primary p-1 rounded hover:bg-surface-100 transition-colors"
                title="Ping server again"
              >
                <RefreshCw className={`w-3 h-3 ${status === 'checking' ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Status Indicator */}
            {status === 'ready' ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-2 p-2 rounded-lg bg-emerald-50/80 border border-emerald-200/60 text-emerald-800">
                  <div className="relative flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 font-medium">
                    <div className="flex items-center space-x-1">
                      <span>Server Ready to Use</span>
                      <span className="text-emerald-600 font-bold">✓</span>
                    </div>
                    <div className="text-[10px] text-emerald-600 font-mono">
                      Cold start complete • API operational
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-1 font-mono text-[11px] text-ink-secondary">
                  <div className="bg-surface-50 p-1.5 rounded border border-surface-100">
                    <span className="text-ink-faint block text-[10px]">DB Latency</span>
                    <span className="font-semibold text-emerald-700">
                      {healthData?.services?.database?.latencyMs ?? 250}ms
                    </span>
                  </div>
                  <div className="bg-surface-50 p-1.5 rounded border border-surface-100">
                    <span className="text-ink-faint block text-[10px]">Environment</span>
                    <span className="font-semibold text-ink-primary">Production</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-start space-x-2 p-2 rounded-lg bg-amber-50/80 border border-amber-200/60 text-amber-900">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium text-amber-900 flex items-center justify-between">
                      <span>Waking up free tier...</span>
                      <span className="font-mono text-[10px] bg-amber-100 px-1.5 py-0.2 rounded text-amber-800">
                        {elapsedSeconds}s
                      </span>
                    </div>
                    <div className="text-[10px] text-amber-700 mt-0.5 leading-relaxed">
                      Render spins down idle instances. Takes ~30-50s to spin up.
                    </div>
                  </div>
                </div>

                <div className="w-full bg-surface-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-amber-500 h-1.5 rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${Math.min(95, Math.max(15, (elapsedSeconds / 45) * 100))}%`,
                    }}
                  ></div>
                </div>

                <div className="text-[10px] text-ink-muted text-center font-mono">
                  Checking health endpoint (attempt #{retryCount + 1})...
                </div>
              </div>
            )}

            {/* Free Tier Info Note */}
            <div className="pt-1 text-[10px] text-ink-faint border-t border-surface-100 flex items-center justify-between font-mono">
              <span>Free-tier hosted on Render</span>
              <span className="inline-flex items-center text-emerald-600">
                <Zap className="w-2.5 h-2.5 mr-0.5 text-amber-500" />
                Zero Cost
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

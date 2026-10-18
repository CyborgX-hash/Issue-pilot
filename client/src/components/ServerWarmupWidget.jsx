import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api.js';
import {
  CheckCircle2,
  Loader2,
  Server,
  X,
  Zap,
} from 'lucide-react';

const ESTIMATED_COLD_START_SECONDS = 45;

export function ServerWarmupWidget() {
  const [status, setStatus] = useState('checking'); // 'checking' | 'ready'
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [healthData, setHealthData] = useState(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const timerRef = useRef(null);
  const pollRef = useRef(null);
  const dismissTimerRef = useRef(null);

  const checkHealth = async () => {
    try {
      const data = await api.getHealth();
      if (data && data.status === 'healthy') {
        setStatus('ready');
        setHealthData(data);

        // Stop polling and timer
        if (pollRef.current) clearInterval(pollRef.current);
        if (timerRef.current) clearInterval(timerRef.current);

        // Auto-remove the widget 2.5 seconds after showing the live tick
        dismissTimerRef.current = setTimeout(() => {
          setIsFadingOut(true);
          setTimeout(() => {
            setIsDismissed(true);
          }, 400); // Wait for transition
        }, 2500);
      }
    } catch {
      // Server still cold-starting
      setStatus('checking');
    }
  };

  useEffect(() => {
    // Start countdown timer
    timerRef.current = setInterval(() => {
      setElapsedSeconds(s => s + 1);
    }, 1000);

    // Initial check
    checkHealth();

    // Poll every 2.5 seconds until live
    pollRef.current = setInterval(() => {
      checkHealth();
    }, 2500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, []);

  if (isDismissed) {
    return null;
  }

  const remainingSeconds = Math.max(0, ESTIMATED_COLD_START_SECONDS - elapsedSeconds);
  const progressPercent = Math.min(
    100,
    status === 'ready' ? 100 : Math.round((elapsedSeconds / ESTIMATED_COLD_START_SECONDS) * 100)
  );

  return (
    <div
      className={`fixed right-4 sm:right-6 top-1/2 -translate-y-1/2 z-40 transition-all duration-400 ease-in-out ${
        isFadingOut ? 'opacity-0 translate-x-8 pointer-events-none' : 'opacity-100 translate-x-0'
      }`}
    >
      <div className="w-72 sm:w-80 bg-white/95 backdrop-blur-md border border-surface-200/90 rounded-xl shadow-xl p-3.5 text-xs relative">
        {/* Manual Dismiss Button */}
        <button
          onClick={() => {
            setIsFadingOut(true);
            setTimeout(() => setIsDismissed(true), 300);
          }}
          className="absolute top-2.5 right-2.5 text-ink-faint hover:text-ink-secondary p-1 rounded-md hover:bg-surface-100 transition-colors"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {status === 'ready' ? (
          // Server Live State (Shown briefly before disappearing)
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-emerald-800">
              <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <div className="font-semibold text-emerald-900 flex items-center space-x-1">
                  <span>Render Server Live</span>
                  <span className="text-emerald-600 font-bold">✓</span>
                </div>
                <div className="text-[10px] text-emerald-700 font-mono">
                  Ready to triage • API connected ({healthData?.services?.database?.latencyMs ?? 140}ms)
                </div>
              </div>
            </div>

            <div className="w-full bg-emerald-100 rounded-full h-1 overflow-hidden">
              <div className="bg-emerald-500 h-1 rounded-full w-full"></div>
            </div>
          </div>
        ) : (
          // Countdown / Warming Up State
          <div className="space-y-2.5">
            <div className="flex items-center space-x-2">
              <Server className="w-4 h-4 text-ink-secondary" />
              <span className="font-semibold text-ink-primary tracking-tight">Waking Render Server</span>
            </div>

            <div className="flex items-start space-x-2 p-2 rounded-lg bg-amber-50/90 border border-amber-200/70 text-amber-900">
              <Loader2 className="w-4 h-4 animate-spin text-amber-600 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-amber-900 flex items-center justify-between">
                  <span>Free-tier spin up</span>
                  <span className="font-mono text-[11px] font-bold bg-amber-200/80 px-1.5 py-0.5 rounded text-amber-950">
                    {remainingSeconds > 0 ? `~${remainingSeconds}s` : 'Finalizing...'}
                  </span>
                </div>
                <div className="text-[10px] text-amber-800/90 mt-0.5 leading-relaxed">
                  {remainingSeconds > 0
                    ? `Render spins down idle servers. Auto-starts in ~${remainingSeconds} seconds.`
                    : 'Backend is booting up now, almost ready...'}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-surface-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-amber-500 h-1.5 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${Math.max(10, progressPercent)}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-ink-faint font-mono pt-0.5 border-t border-surface-100">
              <span className="truncate max-w-[170px]">issue-pilot.onrender.com</span>
              <span className="inline-flex items-center text-amber-600 font-medium">
                <Zap className="w-2.5 h-2.5 mr-0.5" />
                Render Free Tier
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

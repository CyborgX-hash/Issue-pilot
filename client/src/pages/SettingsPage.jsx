import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { api } from '../services/api.js';
import { LoadingState } from '../components/LoadingState.jsx';
import {
  Settings,
  Shield,
  Cpu,
  Database,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export function SettingsPage() {
  const { user } = useAuth();
  const [installations, setInstallations] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const [instRes, healthRes] = await Promise.all([
        api.getInstallations().catch(() => ({ installations: [] })),
        api.getHealth().catch(() => null),
      ]);
      setInstallations(instRes.installations || []);
      setHealth(healthRes);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSettings();
    setRefreshing(false);
  };

  if (loading) return <LoadingState message="Loading system settings..." />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-surface-200">
        <div>
          <h1 className="text-xl font-semibold text-ink-primary tracking-tight">System & Account Settings</h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Manage your GitHub authorizations, AI model settings, and diagnostics.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          className="p-1.5 border border-surface-200 rounded text-ink-muted hover:text-ink-primary hover:bg-surface-50"
          title="Refresh settings"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Account Info */}
      <div className="border border-surface-200 rounded-lg bg-white p-5 space-y-4 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-muted font-mono flex items-center space-x-1.5">
          <Shield className="w-3.5 h-3.5" />
          <span>Authenticated Account</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3 rounded bg-surface-50 border border-surface-200">
            <span className="text-ink-muted block text-[10px] uppercase">GitHub Username</span>
            <span className="font-semibold text-ink-primary mt-1 block">{user?.githubUsername}</span>
          </div>

          <div className="p-3 rounded bg-surface-50 border border-surface-200">
            <span className="text-ink-muted block text-[10px] uppercase">Email</span>
            <span className="font-semibold text-ink-primary mt-1 block">{user?.email || 'Private / Not disclosed'}</span>
          </div>
        </div>
      </div>

      {/* GitHub App Installations */}
      <div className="border border-surface-200 rounded-lg bg-white p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-muted font-mono">
            Connected GitHub App Installations
          </h2>

          <a
            href="https://github.com/apps/issuepilot/installations/new"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-brand-600 hover:text-brand-700 flex items-center space-x-1 font-medium"
          >
            <span>Manage on GitHub</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {installations.length === 0 ? (
          <p className="text-xs text-ink-muted italic py-2">
            No active installations found. Click "Manage on GitHub" to install IssuePilot on your repositories.
          </p>
        ) : (
          <div className="divide-y divide-surface-100 border border-surface-200 rounded">
            {installations.map((inst) => (
              <div key={inst.id} className="p-3 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  {inst.accountAvatarUrl && (
                    <img src={inst.accountAvatarUrl} alt={inst.accountLogin} className="w-6 h-6 rounded-full" />
                  )}
                  <div>
                    <span className="font-medium text-ink-primary">{inst.accountLogin}</span>
                    <span className="text-[11px] font-mono text-ink-muted block">
                      Type: {inst.accountType} • {inst.repositoryCount} repositories
                    </span>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {inst.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Engine Configuration */}
      <div className="border border-surface-200 rounded-lg bg-white p-5 space-y-4 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-muted font-mono flex items-center space-x-1.5">
          <Cpu className="w-3.5 h-3.5 text-brand-600" />
          <span>Open-Weight AI Engine</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 rounded bg-surface-50 border border-surface-200">
            <span className="text-ink-muted block text-[10px] uppercase">Instruction Model</span>
            <span className="font-semibold text-ink-primary mt-1 block">Gemma 2 9B IT</span>
          </div>

          <div className="p-3 rounded bg-surface-50 border border-surface-200">
            <span className="text-ink-muted block text-[10px] uppercase">Embedding Vector Model</span>
            <span className="font-semibold text-ink-primary mt-1 block">all-MiniLM-L6-v2</span>
          </div>

          <div className="p-3 rounded bg-surface-50 border border-surface-200">
            <span className="text-ink-muted block text-[10px] uppercase">Structured Format</span>
            <span className="font-semibold text-ink-primary mt-1 block">Strict Zod JSON</span>
          </div>
        </div>
      </div>

      {/* Infrastructure Diagnostics */}
      <div className="border border-surface-200 rounded-lg bg-white p-5 space-y-4 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-muted font-mono flex items-center space-x-1.5">
          <Database className="w-3.5 h-3.5 text-emerald-600" />
          <span>Infrastructure Health Diagnostics</span>
        </h2>

        {health ? (
          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between p-2 rounded bg-surface-50 border border-surface-200">
              <span className="text-ink-muted">REST API Service</span>
              <span className="text-emerald-700 font-semibold flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{health.services?.api?.toUpperCase() || 'OPERATIONAL'}</span>
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-surface-50 border border-surface-200">
              <span className="text-ink-muted">MySQL Database Connection</span>
              <span className="text-emerald-700 font-semibold flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{health.services?.database?.status?.toUpperCase()} ({health.services?.database?.latencyMs}ms)</span>
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-surface-50 border border-surface-200">
              <span className="text-ink-muted">Server Uptime</span>
              <span className="text-ink-secondary">{Math.floor(health.uptime)} seconds</span>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Could not reach health check endpoint.</span>
          </div>
        )}
      </div>
    </div>
  );
}

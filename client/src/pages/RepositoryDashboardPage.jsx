import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { LoadingState } from '../components/LoadingState.jsx';
import { CategoryBadge, PriorityBadge } from '../components/Badges.jsx';
import {
  FolderGit2,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ListFilter,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

export function RepositoryDashboardPage() {
  const { id } = useParams();
  const [repoData, setRepoData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [batchAnalyzing, setBatchAnalyzing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [repoRes, statsRes] = await Promise.all([
        api.getRepository(id),
        api.getRepositoryStats(id),
      ]);
      setRepoData(repoRes.repository);
      setStats(statsRes.stats);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load repository overview.');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      setFeedback(null);
      const res = await api.syncRepository(id);
      setFeedback({ type: 'success', message: res.message });
      await loadData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSyncing(false);
    }
  };

  const handleBatchAnalyze = async () => {
    try {
      setBatchAnalyzing(true);
      setFeedback(null);
      const res = await api.batchAnalyzeRepository(id, 10);
      setFeedback({
        type: 'success',
        message: res.message || 'Batch analysis completed.',
      });
      await loadData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setBatchAnalyzing(false);
    }
  };

  if (loading) return <LoadingState message="Loading repository dashboard..." />;
  if (error) return (
    <div className="max-w-4xl mx-auto my-12 p-4 border border-rose-200 bg-rose-50 text-rose-700 text-xs rounded">
      {error}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-surface-200">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-semibold text-ink-primary tracking-tight">
              {repoData.fullName}
            </h1>
            <a
              href={`https://github.com/${repoData.fullName}`}
              target="_blank"
              rel="noreferrer"
              className="text-ink-muted hover:text-ink-primary"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <p className="text-xs text-ink-muted mt-0.5">
            Default branch: <span className="font-mono">{repoData.defaultBranch}</span> • Visibility: <span className="font-mono">{repoData.visibility}</span>
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center px-3 py-1.5 border border-surface-200 hover:border-surface-300 rounded text-xs font-medium text-ink-secondary hover:text-ink-primary bg-white disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Issues'}
          </button>

          <button
            onClick={handleBatchAnalyze}
            disabled={batchAnalyzing || stats?.untriagedIssues === 0}
            className="inline-flex items-center px-3 py-1.5 bg-ink-primary hover:bg-ink-secondary text-white text-xs font-medium rounded disabled:opacity-50 transition-colors"
          >
            <Sparkles className={`w-3.5 h-3.5 mr-1.5 ${batchAnalyzing ? 'animate-spin' : ''}`} />
            {batchAnalyzing ? 'Analyzing...' : 'Analyze Issues'}
          </button>

          <Link
            to={`/repositories/${id}/issues`}
            className="inline-flex items-center px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 text-xs font-medium rounded transition-colors"
          >
            <ListFilter className="w-3.5 h-3.5 mr-1.5" />
            Issue Explorer
          </Link>
        </div>
      </div>

      {/* Action Feedback */}
      {feedback && (
        <div className={`p-3 rounded text-xs flex items-center justify-between border ${
          feedback.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="underline ml-2">Dismiss</button>
        </div>
      )}

      {/* Real Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="border border-surface-200 rounded-lg p-4 bg-white">
          <span className="text-[11px] font-mono uppercase text-ink-muted tracking-wider">Total Issues</span>
          <div className="text-2xl font-bold font-mono text-ink-primary mt-1">{stats?.totalIssues ?? 0}</div>
        </div>

        <div className="border border-surface-200 rounded-lg p-4 bg-white">
          <span className="text-[11px] font-mono uppercase text-ink-muted tracking-wider">Open Issues</span>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">{stats?.openIssues ?? 0}</div>
        </div>

        <div className="border border-surface-200 rounded-lg p-4 bg-white">
          <span className="text-[11px] font-mono uppercase text-ink-muted tracking-wider">Untriaged</span>
          <div className="text-2xl font-bold font-mono text-amber-700 mt-1">{stats?.untriagedIssues ?? 0}</div>
        </div>

        <div className="border border-surface-200 rounded-lg p-4 bg-white">
          <span className="text-[11px] font-mono uppercase text-ink-muted tracking-wider">Triaged by AI</span>
          <div className="text-2xl font-bold font-mono text-brand-700 mt-1">{stats?.triagedIssues ?? 0}</div>
        </div>
      </div>

      {/* Distributions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="border border-surface-200 rounded-lg bg-white p-5 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-muted font-mono">
            Classified Categories
          </h2>

          {Object.keys(stats?.categoryDistribution || {}).length === 0 ? (
            <p className="text-xs text-ink-muted italic py-4">No issues analyzed yet. Run "Analyze Issues" to categorize.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(stats.categoryDistribution).map(([category, count]) => (
                <div key={category} className="flex items-center justify-between text-xs py-1 border-b border-surface-100 last:border-0">
                  <CategoryBadge category={category} />
                  <span className="font-mono text-ink-secondary">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Priority Breakdown */}
        <div className="border border-surface-200 rounded-lg bg-white p-5 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-muted font-mono">
            Assigned Priorities
          </h2>

          {Object.keys(stats?.priorityDistribution || {}).length === 0 ? (
            <p className="text-xs text-ink-muted italic py-4">No priority recommendations available yet.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(stats.priorityDistribution).map(([priority, count]) => (
                <div key={priority} className="flex items-center justify-between text-xs py-1 border-b border-surface-100 last:border-0">
                  <PriorityBadge priority={priority} />
                  <span className="font-mono text-ink-secondary">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

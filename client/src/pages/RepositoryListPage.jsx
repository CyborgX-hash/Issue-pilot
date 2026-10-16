import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { LoadingState } from '../components/LoadingState.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import {
  FolderGit2,
  RefreshCw,
  Search,
  ExternalLink,
  Plus,
  Shield,
  Clock,
  Inbox,
  AlertCircle,
} from 'lucide-react';

export function RepositoryListPage() {
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [syncingId, setSyncingId] = useState(null);
  const [syncFeedback, setSyncFeedback] = useState(null);

  useEffect(() => {
    fetchRepositories();
  }, []);

  const fetchRepositories = async () => {
    try {
      setLoading(true);
      const res = await api.getRepositories();
      setRepositories(res.repositories || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch repositories.');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (repoId, repoName, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setSyncingId(repoId);
      setSyncFeedback(null);
      const res = await api.syncRepository(repoId);
      setSyncFeedback({
        repoId,
        type: 'success',
        message: res.message || 'Issues synchronized successfully.',
      });
      await fetchRepositories();
    } catch (err) {
      setSyncFeedback({
        repoId,
        type: 'error',
        message: err.message || 'Synchronization failed.',
      });
    } finally {
      setSyncingId(null);
    }
  };

  const filtered = repositories.filter(repo =>
    repo.fullName.toLowerCase().includes(search.toLowerCase()) ||
    (repo.description && repo.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-surface-200">
        <div>
          <h1 className="text-xl font-semibold text-ink-primary tracking-tight">Connected Repositories</h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Repositories with active IssuePilot GitHub App authorization.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchRepositories}
            title="Refresh repository list"
            className="p-1.5 border border-surface-200 rounded text-ink-muted hover:text-ink-primary hover:bg-surface-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <a
            href="https://github.com/apps/issuepilot/installations/new"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center px-3 py-1.5 bg-ink-primary hover:bg-ink-secondary text-white text-xs font-medium rounded transition-colors"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Install on GitHub
          </a>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            placeholder="Search repositories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-surface-200 rounded text-xs text-ink-primary placeholder:text-ink-muted focus:outline-none focus:border-brand-500 bg-white"
          />
        </div>

        <span className="text-xs text-ink-muted font-mono">
          {filtered.length} of {repositories.length} repositories
        </span>
      </div>

      {/* Global Sync Feedback */}
      {syncFeedback && (
        <div className={`p-3 rounded text-xs flex items-center justify-between border ${
          syncFeedback.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <span>{syncFeedback.message}</span>
          <button
            onClick={() => setSyncFeedback(null)}
            className="text-xs font-mono underline ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <LoadingState message="Fetching connected repositories..." />
      ) : error ? (
        <div className="p-4 border border-rose-200 bg-rose-50 rounded text-xs text-rose-700">
          <div className="font-semibold mb-1">Failed to load repositories</div>
          <div>{error}</div>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No repositories connected"
          description={
            search
              ? 'No repositories match your search query.'
              : 'You have not installed the IssuePilot GitHub App on any repositories yet.'
          }
          icon={FolderGit2}
          action={
            <a
              href="https://github.com/apps/issuepilot/installations/new"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center px-3 py-1.5 bg-ink-primary text-white text-xs font-medium rounded hover:bg-ink-secondary"
            >
              Install GitHub App
            </a>
          }
        />
      ) : (
        <div className="border border-surface-200 rounded-lg overflow-hidden bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-50 border-b border-surface-200 font-mono text-[11px] text-ink-muted uppercase tracking-wider">
                  <th className="py-2.5 px-4">Repository</th>
                  <th className="py-2.5 px-4">Visibility</th>
                  <th className="py-2.5 px-4 text-center">Issues</th>
                  <th className="py-2.5 px-4 text-center">Untriaged</th>
                  <th className="py-2.5 px-4">Last Sync</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {filtered.map((repo) => (
                  <tr key={repo.id} className="hover:bg-surface-50 transition-colors group">
                    <td className="py-3 px-4">
                      <Link
                        to={`/repositories/${repo.id}`}
                        className="font-medium text-ink-primary hover:text-brand-600 flex items-center space-x-1.5"
                      >
                        <span>{repo.fullName}</span>
                      </Link>
                      {repo.description && (
                        <p className="text-[11px] text-ink-muted truncate max-w-md mt-0.5">
                          {repo.description}
                        </p>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase border border-surface-200 bg-surface-50 text-ink-muted">
                        {repo.visibility}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center font-mono">
                      {repo.totalIssues}
                    </td>

                    <td className="py-3 px-4 text-center font-mono">
                      {repo.untriagedIssues > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          {repo.untriagedIssues}
                        </span>
                      ) : (
                        <span className="text-ink-faint">0</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-ink-muted text-[11px] font-mono">
                      {repo.lastSyncAt ? (
                        <span>{new Date(repo.lastSyncAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</span>
                      ) : (
                        <span className="text-ink-faint">Never</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={(e) => handleSync(repo.id, repo.fullName, e)}
                        disabled={syncingId === repo.id}
                        className="inline-flex items-center px-2 py-1 border border-surface-200 hover:border-surface-300 rounded text-[11px] font-medium text-ink-secondary hover:text-ink-primary disabled:opacity-50 transition-colors"
                      >
                        <RefreshCw className={`w-3 h-3 mr-1 ${syncingId === repo.id ? 'animate-spin' : ''}`} />
                        {syncingId === repo.id ? 'Syncing...' : 'Sync'}
                      </button>

                      <Link
                        to={`/repositories/${repo.id}`}
                        className="inline-flex items-center px-2.5 py-1 bg-surface-100 hover:bg-surface-200 rounded text-[11px] font-medium text-ink-primary transition-colors"
                      >
                        Dashboard
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

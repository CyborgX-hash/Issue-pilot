import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { LoadingState } from '../components/LoadingState.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { CategoryBadge, PriorityBadge, StateBadge } from '../components/Badges.jsx';
import {
  Search,
  Filter,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

export function IssueExplorerPage() {
  const { id } = useParams();
  const [repo, setRepo] = useState(null);
  const [issues, setIssues] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('open');
  const [triageFilter, setTriageFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.getRepository(id).then(res => setRepo(res.repository)).catch(() => {});
  }, [id]);

  useEffect(() => {
    fetchIssues();
  }, [id, page, stateFilter, triageFilter]);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 20,
        ...(stateFilter ? { state: stateFilter } : {}),
        ...(triageFilter ? { triageStatus: triageFilter } : {}),
        ...(search ? { search } : {}),
      };

      const res = await api.getRepositoryIssues(id, params);
      setIssues(res.issues || []);
      setPagination(res.pagination || { page: 1, totalPages: 1, totalCount: 0 });
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load issues.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchIssues();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-surface-200">
        <div className="flex items-center space-x-3">
          <Link
            to={`/repositories/${id}`}
            className="p-1.5 border border-surface-200 rounded text-ink-muted hover:text-ink-primary hover:bg-surface-50 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-ink-primary tracking-tight">
              Issue Explorer
            </h1>
            <p className="text-xs text-ink-muted mt-0.5">
              {repo?.fullName || 'Repository'} • {pagination.totalCount} matching issues
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 border border-surface-200 rounded-lg">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            placeholder="Search by issue title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-surface-200 rounded text-xs text-ink-primary placeholder:text-ink-muted focus:outline-none focus:border-brand-500"
          />
        </form>

        <div className="flex items-center space-x-2">
          {/* State filter */}
          <select
            value={stateFilter}
            onChange={(e) => { setStateFilter(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 border border-surface-200 rounded text-xs text-ink-secondary bg-white focus:outline-none"
          >
            <option value="">All States</option>
            <option value="open">Open Only</option>
            <option value="closed">Closed Only</option>
          </select>

          {/* Triage status filter */}
          <select
            value={triageFilter}
            onChange={(e) => { setTriageFilter(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 border border-surface-200 rounded text-xs text-ink-secondary bg-white focus:outline-none"
          >
            <option value="">All Triage</option>
            <option value="untriaged">Untriaged Only</option>
            <option value="triaged">Triaged Only</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingState message="Loading issues..." />
      ) : error ? (
        <div className="p-4 border border-rose-200 bg-rose-50 rounded text-xs text-rose-700">
          {error}
        </div>
      ) : issues.length === 0 ? (
        <EmptyState
          title="No issues found"
          description="Try adjusting your state, triage, or search filters."
        />
      ) : (
        <div className="border border-surface-200 rounded-lg overflow-hidden bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-50 border-b border-surface-200 font-mono text-[11px] text-ink-muted uppercase tracking-wider">
                  <th className="py-2.5 px-4 w-16">#</th>
                  <th className="py-2.5 px-4">Title & Details</th>
                  <th className="py-2.5 px-4 w-28">Category</th>
                  <th className="py-2.5 px-4 w-24">Priority</th>
                  <th className="py-2.5 px-4 w-24">State</th>
                  <th className="py-2.5 px-4 text-right w-24">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {issues.map((iss) => (
                  <tr key={iss.id} className="hover:bg-surface-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-ink-muted">
                      #{iss.issueNumber}
                    </td>

                    <td className="py-3 px-4">
                      <Link
                        to={`/issues/${iss.id}`}
                        className="font-medium text-ink-primary hover:text-brand-600 block line-clamp-1"
                      >
                        {iss.title}
                      </Link>
                      <div className="flex items-center space-x-2 text-[11px] text-ink-muted mt-1">
                        <span>by {iss.authorUsername}</span>
                        <span>•</span>
                        {iss.labels.length > 0 && (
                          <div className="flex items-center space-x-1">
                            {iss.labels.slice(0, 3).map((lbl, idx) => (
                              <span key={idx} className="px-1.5 py-0.2 rounded text-[10px] font-mono border border-surface-200 bg-surface-50">
                                {typeof lbl === 'string' ? lbl : lbl.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {iss.latestAnalysis ? (
                        <CategoryBadge category={iss.latestAnalysis.category} />
                      ) : (
                        <span className="text-ink-faint text-[11px] font-mono">Untriaged</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {iss.latestAnalysis ? (
                        <PriorityBadge priority={iss.latestAnalysis.priority} />
                      ) : (
                        <span className="text-ink-faint text-[11px] font-mono">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <StateBadge state={iss.state} />
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/issues/${iss.id}`}
                        className="inline-flex items-center px-2 py-1 bg-surface-100 hover:bg-surface-200 text-ink-primary rounded text-[11px] font-medium transition-colors"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-surface-50 border-t border-surface-200 px-4 py-3 flex items-center justify-between text-xs text-ink-muted">
            <span>
              Page <span className="font-mono text-ink-primary">{pagination.page}</span> of <span className="font-mono text-ink-primary">{pagination.totalPages}</span>
            </span>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="p-1 border border-surface-200 rounded disabled:opacity-40 hover:bg-white text-ink-secondary"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="p-1 border border-surface-200 rounded disabled:opacity-40 hover:bg-white text-ink-secondary"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

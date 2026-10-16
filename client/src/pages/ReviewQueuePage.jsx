import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { LoadingState } from '../components/LoadingState.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { ActionBadge } from '../components/Badges.jsx';
import {
  CheckSquare,
  Check,
  X,
  Send,
  ExternalLink,
  Edit2,
  Save,
  Filter,
  RefreshCw,
} from 'lucide-react';

export function ReviewQueuePage() {
  const [actions, setActions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [editedPayload, setEditedPayload] = useState({});
  const [processingId, setProcessingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    fetchActions();
  }, [statusFilter, page]);

  const fetchActions = async () => {
    try {
      setLoading(true);
      const res = await api.getTriageActions({
        status: statusFilter || undefined,
        page,
        limit: 15,
      });
      setActions(res.actions || []);
      setPagination(res.pagination || { page: 1, totalPages: 1, totalCount: 0 });
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load review queue.');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (action) => {
    setEditingId(action.id);
    setEditedPayload(JSON.parse(JSON.stringify(action.proposedPayload || {})));
  };

  const handleApprove = async (actionId, payload = null) => {
    try {
      setProcessingId(actionId);
      setFeedback(null);
      await api.approveTriageAction(actionId, payload);
      setFeedback({ type: 'success', message: 'Action approved successfully.' });
      setEditingId(null);
      await fetchActions();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (actionId) => {
    try {
      setProcessingId(actionId);
      setFeedback(null);
      await api.rejectTriageAction(actionId);
      setFeedback({ type: 'info', message: 'Action rejected.' });
      await fetchActions();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setProcessingId(null);
    }
  };

  const handleApply = async (actionId) => {
    try {
      setProcessingId(actionId);
      setFeedback(null);
      await api.applyTriageAction(actionId);
      setFeedback({ type: 'success', message: 'Action applied to GitHub!' });
      await fetchActions();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-surface-200">
        <div>
          <h1 className="text-xl font-semibold text-ink-primary tracking-tight">Review Queue</h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Human-in-the-loop approval workflow. Inspect and confirm AI triage proposals before GitHub execution.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Status Tabs */}
          {['PENDING', 'APPROVED', 'APPLIED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => { setStatusFilter(st); setPage(1); }}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                statusFilter === st
                  ? 'bg-ink-primary text-white font-semibold'
                  : 'border border-surface-200 bg-white text-ink-secondary hover:bg-surface-50'
              }`}
            >
              {st}
            </button>
          ))}

          <button
            onClick={fetchActions}
            className="p-1.5 border border-surface-200 rounded text-ink-muted hover:text-ink-primary hover:bg-surface-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div className={`p-3 rounded text-xs flex items-center justify-between border ${
          feedback.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : feedback.type === 'info'
            ? 'bg-surface-100 text-ink-secondary border-surface-200'
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="underline ml-2">Dismiss</button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <LoadingState message="Loading review queue..." />
      ) : error ? (
        <div className="p-4 border border-rose-200 bg-rose-50 rounded text-xs text-rose-700">
          {error}
        </div>
      ) : actions.length === 0 ? (
        <EmptyState
          title={`No ${statusFilter.toLowerCase()} triage actions`}
          description="Actions appear here when AI analyzes repository issues and recommends label applications or clarification requests."
          icon={CheckSquare}
        />
      ) : (
        <div className="space-y-4">
          {actions.map((action) => {
            const isEditing = editingId === action.id;
            const isPending = action.approvalStatus === 'PENDING';
            const isApproved = action.approvalStatus === 'APPROVED';

            return (
              <div
                key={action.id}
                className="border border-surface-200 rounded-lg bg-white p-5 space-y-4 shadow-sm"
              >
                {/* Action Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-surface-100">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                      {action.actionType.replace('_', ' ')}
                    </span>
                    <ActionBadge status={action.approvalStatus} />
                    <span className="text-xs text-ink-muted">for</span>
                    <Link
                      to={`/issues/${action.issue.id}`}
                      className="text-xs font-semibold text-ink-primary hover:text-brand-600 line-clamp-1"
                    >
                      {action.issue.repository.fullName} #{action.issue.issueNumber} - {action.issue.title}
                    </Link>
                  </div>

                  <div className="flex items-center space-x-2 text-[11px] font-mono text-ink-muted">
                    <span>Created: {new Date(action.createdAt).toLocaleTimeString()}</span>
                    <a
                      href={action.issue.htmlUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-ink-muted hover:text-ink-primary"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Proposed Payload Content */}
                <div className="bg-surface-50 p-4 rounded border border-surface-200 text-xs font-mono space-y-2">
                  <div className="text-[10px] uppercase text-ink-muted font-semibold tracking-wider flex items-center justify-between">
                    <span>Proposed Modification</span>
                    {isPending && !isEditing && (
                      <button
                        onClick={() => startEdit(action)}
                        className="text-brand-600 hover:text-brand-700 font-sans flex items-center space-x-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit Payload</span>
                      </button>
                    )}
                  </div>

                  {action.actionType === 'APPLY_LABELS' ? (
                    isEditing ? (
                      <div className="space-y-2 font-sans">
                        <label className="text-[11px] text-ink-muted block">Comma-separated label names:</label>
                        <input
                          type="text"
                          value={(editedPayload.labels || []).join(', ')}
                          onChange={(e) => setEditedPayload({
                            ...editedPayload,
                            labels: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                          })}
                          className="w-full p-2 border border-surface-300 rounded text-xs font-mono"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(action.proposedPayload?.labels || []).map((lbl, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded text-xs font-mono bg-white border border-surface-200 text-ink-primary font-medium">
                            {lbl}
                          </span>
                        ))}
                      </div>
                    )
                  ) : (
                    isEditing ? (
                      <textarea
                        rows={4}
                        value={editedPayload.comment || ''}
                        onChange={(e) => setEditedPayload({ ...editedPayload, comment: e.target.value })}
                        className="w-full p-2 border border-surface-300 rounded text-xs font-mono"
                      />
                    ) : (
                      <p className="whitespace-pre-wrap text-ink-secondary leading-relaxed font-mono">
                        {action.proposedPayload?.comment}
                      </p>
                    )
                  )}
                </div>

                {/* Action Controls */}
                <div className="flex items-center justify-between pt-1">
                  <div className="text-[11px] text-ink-muted font-mono">
                    {action.approvingUser && (
                      <span>Approved by {action.approvingUser.githubUsername}</span>
                    )}
                    {action.executedAt && (
                      <span className="ml-2 text-emerald-700">Executed on GitHub</span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {isEditing && (
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2.5 py-1 border border-surface-200 rounded text-xs font-medium text-ink-muted hover:bg-surface-50"
                      >
                        Cancel
                      </button>
                    )}

                    {isPending && (
                      <>
                        <button
                          onClick={() => handleReject(action.id)}
                          disabled={processingId === action.id}
                          className="inline-flex items-center px-3 py-1.5 border border-surface-200 hover:border-surface-300 rounded text-xs font-medium text-rose-600 hover:bg-white transition-colors"
                        >
                          <X className="w-3.5 h-3.5 mr-1" />
                          Reject
                        </button>

                        <button
                          onClick={() => handleApprove(action.id, isEditing ? editedPayload : null)}
                          disabled={processingId === action.id}
                          className="inline-flex items-center px-3 py-1.5 bg-surface-100 hover:bg-surface-200 text-ink-primary rounded text-xs font-medium transition-colors"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" />
                          {isEditing ? 'Save & Approve' : 'Approve'}
                        </button>

                        <button
                          onClick={() => handleApply(action.id)}
                          disabled={processingId === action.id}
                          className="inline-flex items-center px-3 py-1.5 bg-ink-primary hover:bg-ink-secondary text-white rounded text-xs font-medium transition-colors"
                        >
                          <Send className="w-3.5 h-3.5 mr-1" />
                          Approve & Apply
                        </button>
                      </>
                    )}

                    {isApproved && (
                      <button
                        onClick={() => handleApply(action.id)}
                        disabled={processingId === action.id}
                        className="inline-flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium transition-colors"
                      >
                        <Send className="w-3.5 h-3.5 mr-1" />
                        Apply to GitHub
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

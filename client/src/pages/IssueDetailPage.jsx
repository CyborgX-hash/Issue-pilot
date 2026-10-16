import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { LoadingState } from '../components/LoadingState.jsx';
import {
  CategoryBadge,
  PriorityBadge,
  StateBadge,
  ActionBadge,
} from '../components/Badges.jsx';
import {
  ArrowLeft,
  ExternalLink,
  Sparkles,
  CopyCheck,
  Check,
  X,
  Send,
  AlertTriangle,
  Info,
  Clock,
  Cpu,
} from 'lucide-react';

export function IssueDetailPage() {
  const { id } = useParams();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [actionProcessing, setActionProcessing] = useState(null);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    loadIssue();
  }, [id]);

  const loadIssue = async () => {
    try {
      setLoading(true);
      const res = await api.getIssue(id);
      setIssue(res.issue);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load issue.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    try {
      setAnalyzing(true);
      setFeedback(null);
      await api.analyzeIssue(id);
      setFeedback({ type: 'success', message: 'Issue analysis generated successfully.' });
      await loadIssue();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Analysis failed.' });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApproveAction = async (actionId) => {
    try {
      setActionProcessing(actionId);
      await api.approveTriageAction(actionId);
      setFeedback({ type: 'success', message: 'Action approved and ready to apply.' });
      await loadIssue();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionProcessing(null);
    }
  };

  const handleRejectAction = async (actionId) => {
    try {
      setActionProcessing(actionId);
      await api.rejectTriageAction(actionId);
      setFeedback({ type: 'info', message: 'Action rejected.' });
      await loadIssue();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionProcessing(null);
    }
  };

  const handleApplyAction = async (actionId) => {
    try {
      setActionProcessing(actionId);
      await api.applyTriageAction(actionId);
      setFeedback({ type: 'success', message: 'Action successfully applied to GitHub!' });
      await loadIssue();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionProcessing(null);
    }
  };

  if (loading) return <LoadingState message="Loading issue details..." />;
  if (error) return (
    <div className="max-w-4xl mx-auto my-12 p-4 border border-rose-200 bg-rose-50 text-rose-700 text-xs rounded">
      {error}
    </div>
  );

  const analysis = issue.latestAnalysis;
  const duplicateCandidates = Array.isArray(analysis?.duplicateCandidates) ? analysis.duplicateCandidates : [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Navigation and Actions */}
      <div className="flex items-center justify-between pb-4 border-b border-surface-200">
        <div className="flex items-center space-x-3">
          <Link
            to={`/repositories/${issue.repository.id}/issues`}
            className="p-1.5 border border-surface-200 rounded text-ink-muted hover:text-ink-primary hover:bg-surface-50 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
          <div>
            <div className="flex items-center space-x-2 text-xs text-ink-muted">
              <span>{issue.repository.fullName}</span>
              <span>•</span>
              <span className="font-mono">#{issue.issueNumber}</span>
            </div>
            <h1 className="text-lg font-semibold text-ink-primary tracking-tight mt-0.5">
              {issue.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="inline-flex items-center px-3 py-1.5 bg-ink-primary hover:bg-ink-secondary text-white text-xs font-medium rounded disabled:opacity-50 transition-colors"
          >
            <Sparkles className={`w-3.5 h-3.5 mr-1.5 ${analyzing ? 'animate-spin' : ''}`} />
            {analyzing ? 'Analyzing...' : analysis ? 'Re-Analyze Issue' : 'Analyze Issue'}
          </button>

          <a
            href={issue.htmlUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center px-3 py-1.5 border border-surface-200 hover:border-surface-300 rounded text-xs font-medium text-ink-secondary hover:text-ink-primary bg-white transition-colors"
          >
            <span>View on GitHub</span>
            <ExternalLink className="w-3 h-3 ml-1.5" />
          </a>
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

      {/* Two Column Layout: Issue Details & AI Triage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Original Issue Description */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-surface-200 rounded-lg bg-white p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-surface-100 text-xs">
              <div className="flex items-center space-x-2">
                {issue.authorAvatarUrl ? (
                  <img src={issue.authorAvatarUrl} alt={issue.authorUsername} className="w-5 h-5 rounded-full" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-surface-200 font-mono flex items-center justify-center text-[10px]">
                    {issue.authorUsername?.[0] || 'U'}
                  </div>
                )}
                <span className="font-medium text-ink-primary">{issue.authorUsername}</span>
                <span className="text-ink-muted">opened this issue</span>
              </div>
              <StateBadge state={issue.state} />
            </div>

            <div className="prose prose-sm max-w-none text-xs text-ink-secondary font-mono whitespace-pre-wrap leading-relaxed bg-surface-50 p-4 rounded border border-surface-200">
              {issue.body || 'No description provided.'}
            </div>

            {/* Existing Labels */}
            {issue.labels?.length > 0 && (
              <div className="pt-2 border-t border-surface-100">
                <span className="text-[11px] font-mono uppercase text-ink-muted block mb-1.5">Repository Labels</span>
                <div className="flex flex-wrap gap-1.5">
                  {issue.labels.map((lbl, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded text-xs font-mono border border-surface-200 bg-surface-50 text-ink-secondary">
                      {typeof lbl === 'string' ? lbl : lbl.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Staged Triage Actions Panel */}
          {issue.triageActions?.length > 0 && (
            <div className="border border-surface-200 rounded-lg bg-white p-5 space-y-4 shadow-sm">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-muted font-mono">
                Staged Triage Actions ({issue.triageActions.length})
              </h2>

              <div className="space-y-3">
                {issue.triageActions.map((action) => (
                  <div key={action.id} className="p-3 border border-surface-200 rounded bg-surface-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-semibold text-ink-primary">
                          {action.actionType === 'APPLY_LABELS' ? 'Label Modification' : 'Clarification Comment'}
                        </span>
                        <ActionBadge status={action.approvalStatus} />
                      </div>

                      <span className="text-[10px] font-mono text-ink-muted">
                        {new Date(action.createdAt).toLocaleTimeString()}
                      </span>
                    </div>

                    {/* Proposed Payload */}
                    <div className="text-xs font-mono text-ink-secondary bg-white p-2 rounded border border-surface-200">
                      {action.actionType === 'APPLY_LABELS' ? (
                        <div className="flex items-center space-x-1.5">
                          <span className="text-ink-muted">Proposed Labels:</span>
                          {(action.proposedPayload?.labels || []).map((l, i) => (
                            <span key={i} className="px-1.5 py-0.2 bg-brand-50 text-brand-700 border border-brand-200 rounded text-[11px]">
                              {l}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{action.proposedPayload?.comment}</p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {action.approvalStatus === 'PENDING' && (
                      <div className="flex items-center justify-end space-x-2 pt-1">
                        <button
                          onClick={() => handleRejectAction(action.id)}
                          disabled={actionProcessing === action.id}
                          className="inline-flex items-center px-2.5 py-1 border border-surface-200 hover:border-surface-300 rounded text-xs font-medium text-rose-600 hover:bg-white"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Reject
                        </button>
                        <button
                          onClick={() => handleApproveAction(action.id)}
                          disabled={actionProcessing === action.id}
                          className="inline-flex items-center px-2.5 py-1 bg-surface-200 hover:bg-surface-300 text-ink-primary rounded text-xs font-medium"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleApplyAction(action.id)}
                          disabled={actionProcessing === action.id}
                          className="inline-flex items-center px-3 py-1 bg-ink-primary hover:bg-ink-secondary text-white rounded text-xs font-medium"
                        >
                          <Send className="w-3 h-3 mr-1" />
                          Approve & Apply to GitHub
                        </button>
                      </div>
                    )}

                    {action.approvalStatus === 'APPROVED' && (
                      <div className="flex items-center justify-end space-x-2 pt-1">
                        <button
                          onClick={() => handleApplyAction(action.id)}
                          disabled={actionProcessing === action.id}
                          className="inline-flex items-center px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium"
                        >
                          <Send className="w-3 h-3 mr-1" />
                          Apply to GitHub
                        </button>
                      </div>
                    )}

                    {action.approvalStatus === 'APPLIED' && (
                      <div className="text-[11px] font-mono text-emerald-700 flex items-center space-x-1 pt-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Applied to GitHub on {new Date(action.executedAt).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: AI Analysis & Duplicate Candidates */}
        <div className="space-y-6">
          {/* AI Analysis Card */}
          <div className="border border-surface-200 rounded-lg bg-white p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-surface-100">
              <div className="flex items-center space-x-1.5">
                <Cpu className="w-4 h-4 text-brand-600" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-muted font-mono">
                  AI Recommendation
                </h2>
              </div>
              {analysis && (
                <span className="text-[10px] font-mono text-ink-muted">
                  {analysis.modelId}
                </span>
              )}
            </div>

            {!analysis ? (
              <div className="text-center py-6">
                <p className="text-xs text-ink-muted mb-3">This issue has not been analyzed yet.</p>
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="inline-flex items-center px-3 py-1.5 bg-ink-primary text-white text-xs font-medium rounded hover:bg-ink-secondary"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Run AI Triage
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Classification Badges */}
                <div className="flex items-center justify-between p-2 rounded bg-surface-50 border border-surface-200">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-ink-muted uppercase block">Category</span>
                    <CategoryBadge category={analysis.category} />
                  </div>
                  <div className="space-y-1 text-right">
                    <span className="text-[10px] font-mono text-ink-muted uppercase block">Priority</span>
                    <PriorityBadge priority={analysis.priority} />
                  </div>
                </div>

                {/* Summary */}
                <div>
                  <span className="text-[10px] font-mono uppercase text-ink-muted block mb-1">Summary</span>
                  <p className="text-ink-primary leading-relaxed bg-surface-50 p-2.5 rounded border border-surface-200">
                    {analysis.summary}
                  </p>
                </div>

                {/* Reasoning */}
                <div>
                  <span className="text-[10px] font-mono uppercase text-ink-muted block mb-1">Evidence-Based Reasoning</span>
                  <p className="text-ink-secondary leading-relaxed text-[11px] bg-surface-50 p-2.5 rounded border border-surface-200">
                    {analysis.reasoning}
                  </p>
                </div>

                {/* Suggested Labels */}
                <div>
                  <span className="text-[10px] font-mono uppercase text-ink-muted block mb-1">Suggested Repository Labels</span>
                  {analysis.suggestedLabels?.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {analysis.suggestedLabels.map((lbl, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded text-[11px] font-mono border border-brand-200 bg-brand-50 text-brand-700">
                          {lbl}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[11px] text-ink-faint italic font-mono">None suggested</span>
                  )}
                </div>

                {/* Missing Information */}
                {analysis.missingInfo?.length > 0 && (
                  <div>
                    <span className="text-[10px] font-mono uppercase text-amber-700 block mb-1">Missing Report Information</span>
                    <div className="space-y-1.5">
                      {analysis.missingInfo.map((info, idx) => (
                        <div key={idx} className="p-2 rounded bg-amber-50/50 border border-amber-200 text-[11px]">
                          <span className="font-semibold text-amber-900 font-mono">{info.field}:</span>{' '}
                          <span className="text-amber-800">{info.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Semantic Duplicate Candidates */}
          <div className="border border-surface-200 rounded-lg bg-white p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-surface-100">
              <div className="flex items-center space-x-1.5">
                <CopyCheck className="w-4 h-4 text-ink-muted" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-muted font-mono">
                  Potential Duplicates
                </h2>
              </div>
              <span className="text-[10px] font-mono text-ink-muted">
                Cosine Similarity
              </span>
            </div>

            {duplicateCandidates.length === 0 ? (
              <p className="text-xs text-ink-muted italic py-2">
                No duplicate candidates found above threshold in this repository.
              </p>
            ) : (
              <div className="space-y-2">
                {duplicateCandidates.map((dup) => (
                  <div key={dup.issueId} className="p-2.5 rounded border border-surface-200 bg-surface-50 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <Link
                        to={`/issues/${dup.issueId}`}
                        className="font-medium text-ink-primary hover:text-brand-600 line-clamp-1"
                      >
                        #{dup.issueNumber} {dup.title}
                      </Link>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-amber-50 text-amber-800 border border-amber-200 ml-2 whitespace-nowrap">
                        {Math.round(dup.similarityScore * 100)}% match
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

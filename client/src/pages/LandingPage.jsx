import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { Link } from 'react-router-dom';
import { ServerWarmupWidget } from '../components/ServerWarmupWidget.jsx';
import {
  Tag,
  CopyCheck,
  ShieldCheck,
  Cpu,
  ArrowRight,
  GitBranch,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  GitFork,
  MessageSquare,
  Lock,
  ChevronDown,
  ChevronUp,
  BarChart3,
  ExternalLink,
} from 'lucide-react';

export function LandingPage() {
  const { user, login } = useAuth();
  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    {
      q: 'Will IssuePilot write comments or labels directly to GitHub without my permission?',
      a: 'Never. IssuePilot operates on a strict human-in-the-loop guarantee. All AI classifications, label suggestions, duplicate links, and draft responses are staged in a Review Queue. No action touches GitHub until an authorized maintainer explicitly approves it.',
    },
    {
      q: 'How does IssuePilot handle forked repositories where issues are disabled?',
      a: 'GitHub disables the Issues tab on forks by default. IssuePilot automatically detects forks, resolves the upstream parent repository, and synchronizes active upstream issues so you can test and triage real-world open-source issues directly from your dashboard.',
    },
    {
      q: 'How does semantic duplicate detection work?',
      a: 'When an issue is analyzed, IssuePilot generates vector embeddings of the issue title and body. It computes cosine similarity against all existing issues in the database. Any candidate exceeding the similarity threshold (e.g., >70%) is flagged with a match percentage and direct link.',
    },
    {
      q: 'Which AI model powers the triage engine?',
      a: 'IssuePilot utilizes open-weight Gemma 2 instruction models with strictly defined Zod JSON validation schemas. Prompts are quarantined against injection, and outputs are guaranteed to be well-structured and deterministic.',
    },
    {
      q: 'Is my repository data private and secure?',
      a: 'Yes. IssuePilot requests only the minimum GitHub App permissions required to read issues and labels. Access tokens are encrypted, sessions use secure HTTP-only cookies, and your code content is never used to train public models.',
    },
  ];

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col justify-between relative">
      {/* Floating Render Server Warmup Widget (Middle Right Corner) */}
      <ServerWarmupWidget />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-24 space-y-20">
        {/* Editorial Hero */}
        <div className="space-y-6 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-surface-100 border border-surface-200 text-xs font-mono text-ink-secondary">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Production-Grade GitHub Issue Triage Engine</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-ink-primary leading-[1.15]">
            Less time triaging.<br />
            <span className="text-brand-600">More time building.</span>
          </h1>

          <p className="text-base sm:text-lg text-ink-muted leading-relaxed">
            IssuePilot is an automated AI-powered copilot for open-source maintainers and engineering teams. It ingests incoming GitHub issues, classifies bug reports, flags semantic duplicates, recommends existing repository labels, and drafts clarification responses — all safeguarded with a <strong className="text-ink-primary font-medium">100% human-in-the-loop review queue</strong>.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center px-5 py-2.5 bg-ink-primary hover:bg-ink-secondary text-white text-xs sm:text-sm font-medium rounded-lg shadow-sm hover:shadow transition-all"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            ) : (
              <button
                onClick={login}
                className="inline-flex items-center px-5 py-2.5 bg-ink-primary hover:bg-ink-secondary text-white text-xs sm:text-sm font-medium rounded-lg shadow-sm hover:shadow transition-all"
              >
                Connect GitHub
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            )}

            <a
              href="https://github.com/CyborgX-hash/Issue-pilot"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center px-4 py-2.5 border border-surface-300 hover:border-ink-muted text-ink-secondary hover:text-ink-primary text-xs sm:text-sm font-medium rounded-lg transition-colors bg-white shadow-xs"
            >
              <GitBranch className="w-3.5 h-3.5 mr-2 text-ink-muted" />
              GitHub Repository
              <ExternalLink className="w-3 h-3 ml-1.5 opacity-60" />
            </a>
          </div>

          <div className="flex items-center space-x-6 pt-3 text-xs text-ink-muted font-mono">
            <span className="flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1.5" />
              Human-in-the-Loop Safe
            </span>
            <span className="flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1.5" />
              Upstream Fork Support
            </span>
            <span className="flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1.5" />
              Open-Weight Gemma 2
            </span>
          </div>
        </div>

        {/* Minimal Terminal / Pipeline Preview */}
        <div className="border border-surface-200 rounded-xl bg-white overflow-hidden shadow-sm">
          <div className="bg-surface-50 border-b border-surface-200 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-400"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
              <span className="text-xs font-mono text-ink-muted pl-2">issuepilot :: triage-pipeline-v1</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
              verified human-in-the-loop
            </span>
          </div>

          <div className="p-4 sm:p-6 space-y-4 font-mono text-xs">
            <div className="flex items-start space-x-3 pb-3 border-b border-surface-100">
              <span className="text-ink-faint font-semibold">01</span>
              <div>
                <span className="text-ink-primary font-semibold">Incoming Issue #42:</span>
                <span className="text-ink-secondary ml-1.5">"Application crashes on Stripe webhook timeout with unhandled rejection"</span>
                <div className="text-[11px] text-ink-muted mt-0.5">Source: live GitHub Webhook delivery / upstream fork sync</div>
              </div>
            </div>

            <div className="flex items-start space-x-3 pb-3 border-b border-surface-100">
              <span className="text-ink-faint font-semibold">02</span>
              <div>
                <span className="text-brand-600 font-semibold">Gemma 2 AI Classifier:</span>
                <span className="text-ink-secondary ml-1.5">Category: BUG | Priority: HIGH (P1) | Confidence: 94%</span>
                <div className="text-[11px] text-brand-700/80 mt-0.5">Matched repository labels: ["bug", "backend", "priority:high"]</div>
              </div>
            </div>

            <div className="flex items-start space-x-3 pb-3 border-b border-surface-100">
              <span className="text-ink-faint font-semibold">03</span>
              <div>
                <span className="text-amber-700 font-semibold">Vector Duplicate Discovery:</span>
                <span className="text-ink-secondary ml-1.5">Potential duplicate: Issue #18 (87% cosine similarity, open)</span>
                <div className="text-[11px] text-amber-600 mt-0.5">Recommendation: Staged comment linking candidate duplicate to prevent split discussions</div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <span className="text-ink-faint font-semibold">04</span>
              <div>
                <span className="text-emerald-700 font-semibold">Staged Review Queue:</span>
                <span className="text-ink-secondary ml-1.5">Pending maintainer 1-click approval before writing to GitHub REST API</span>
                <div className="text-[11px] text-emerald-600 mt-0.5">Status: Ready in queue • Zero unsanctioned bot comments</div>
              </div>
            </div>
          </div>
        </div>

        {/* What IssuePilot Does - Detailed Feature Grid */}
        <div className="space-y-6">
          <div className="text-center sm:text-left space-y-2">
            <h2 className="text-xs font-semibold text-brand-600 uppercase tracking-widest font-mono">
              Core Capabilities
            </h2>
            <h3 className="text-2xl sm:text-3xl font-bold text-ink-primary tracking-tight">
              Everything you need to master your issue backlog
            </h3>
            <p className="text-sm text-ink-muted max-w-2xl">
              From real-time webhook ingestion to one-click triage execution, IssuePilot is engineered to eliminate repetitive maintenance chores.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Feature 1 */}
            <div className="border border-surface-200 rounded-xl p-5 bg-white shadow-xs hover:border-surface-300 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
                <Tag className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-semibold text-ink-primary mb-1.5">
                AI Classification & Priority Tagging
              </h4>
              <p className="text-xs text-ink-muted leading-relaxed">
                Automatically determines if an issue is a Bug, Feature Request, Documentation, Security issue, or Question. Assigns actionable priorities (P0 Blocker, P1 High, P2 Medium, P3 Low) based on impact severity.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="border border-surface-200 rounded-xl p-5 bg-white shadow-xs hover:border-surface-300 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                <CopyCheck className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-semibold text-ink-primary mb-1.5">
                Semantic Duplicate Hunter
              </h4>
              <p className="text-xs text-ink-muted leading-relaxed">
                Vector embeddings compute high-dimensional cosine similarity across all past and open issues. Catches duplicates even when different authors use completely different phrasing for the same bug.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="border border-surface-200 rounded-xl p-5 bg-white shadow-xs hover:border-surface-300 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-semibold text-ink-primary mb-1.5">
                Human-in-the-Loop Review Queue
              </h4>
              <p className="text-xs text-ink-muted leading-relaxed">
                Zero surprise bot spam. Suggested labels, duplicate warnings, and replies are staged in an interactive review queue. Maintainers can approve with 1 click, customize payloads, or reject instantly.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="border border-surface-200 rounded-xl p-5 bg-white shadow-xs hover:border-surface-300 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
                <GitFork className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-semibold text-ink-primary mb-1.5">
                Upstream Fork Synchronization
              </h4>
              <p className="text-xs text-ink-muted leading-relaxed">
                GitHub disables issues on forks by default. IssuePilot automatically detects forks and resolves their upstream parent repositories (e.g. sktime, aiondemand), syncing live issues seamlessly into your triage view.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="border border-surface-200 rounded-xl p-5 bg-white shadow-xs hover:border-surface-300 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                <MessageSquare className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-semibold text-ink-primary mb-1.5">
                Intelligent Clarification Drafter
              </h4>
              <p className="text-xs text-ink-muted leading-relaxed">
                When an issue lacks essential details (reproduction steps, system logs, environment specs), IssuePilot drafts polite, structured response templates asking the author for clarification.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="border border-surface-200 rounded-xl p-5 bg-white shadow-xs hover:border-surface-300 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center mb-3">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-semibold text-ink-primary mb-1.5">
                Health & SLA Velocity Analytics
              </h4>
              <p className="text-xs text-ink-muted leading-relaxed">
                Real-time dashboard metrics displaying open vs. closed issues, triage action throughput, priority breakdowns, and database health with sub-second querying speeds.
              </p>
            </div>
          </div>
        </div>

        {/* How It Works - 4 Step Flow */}
        <div className="space-y-6">
          <div className="text-center sm:text-left space-y-2">
            <h2 className="text-xs font-semibold text-brand-600 uppercase tracking-widest font-mono">
              Workflow
            </h2>
            <h3 className="text-2xl sm:text-3xl font-bold text-ink-primary tracking-tight">
              How IssuePilot operates in 4 simple steps
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-surface-50 border border-surface-200 rounded-xl space-y-2">
              <div className="w-6 h-6 rounded-full bg-ink-primary text-white text-xs font-mono font-bold flex items-center justify-center">
                1
              </div>
              <h4 className="text-xs font-semibold text-ink-primary uppercase tracking-wider">
                Connect GitHub
              </h4>
              <p className="text-xs text-ink-muted leading-relaxed">
                Install the IssuePilot GitHub App on your account or organization. Select all repositories or just the ones you want.
              </p>
            </div>

            <div className="p-4 bg-surface-50 border border-surface-200 rounded-xl space-y-2">
              <div className="w-6 h-6 rounded-full bg-ink-primary text-white text-xs font-mono font-bold flex items-center justify-center">
                2
              </div>
              <h4 className="text-xs font-semibold text-ink-primary uppercase tracking-wider">
                Auto-Sync & Webhook
              </h4>
              <p className="text-xs text-ink-muted leading-relaxed">
                IssuePilot receives live webhook events as issues are filed, or performs instant historical synchronization on-demand.
              </p>
            </div>

            <div className="p-4 bg-surface-50 border border-surface-200 rounded-xl space-y-2">
              <div className="w-6 h-6 rounded-full bg-ink-primary text-white text-xs font-mono font-bold flex items-center justify-center">
                3
              </div>
              <h4 className="text-xs font-semibold text-ink-primary uppercase tracking-wider">
                AI Classification
              </h4>
              <p className="text-xs text-ink-muted leading-relaxed">
                Gemma 2 categorizes the issue, scores confidence, computes similarity against existing issues, and drafts actions.
              </p>
            </div>

            <div className="p-4 bg-surface-50 border border-surface-200 rounded-xl space-y-2">
              <div className="w-6 h-6 rounded-full bg-ink-primary text-white text-xs font-mono font-bold flex items-center justify-center">
                4
              </div>
              <h4 className="text-xs font-semibold text-ink-primary uppercase tracking-wider">
                1-Click Execution
              </h4>
              <p className="text-xs text-ink-muted leading-relaxed">
                Review proposed actions in your review queue. Click approve to apply labels and post comments directly to GitHub.
              </p>
            </div>
          </div>
        </div>

        {/* Security & Architecture Highlights */}
        <div className="border border-surface-200 rounded-xl p-6 sm:p-8 bg-surface-50/50 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-brand-600 text-xs font-mono font-semibold uppercase tracking-wider">
                <Lock className="w-3.5 h-3.5" />
                <span>Security & Architecture</span>
              </div>
              <h3 className="text-xl font-bold text-ink-primary mt-1">
                Engineered for security and deterministic execution
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded bg-white border border-surface-200 text-[11px] font-mono text-ink-secondary">
                Zod Schema Validation
              </span>
              <span className="px-2.5 py-1 rounded bg-white border border-surface-200 text-[11px] font-mono text-ink-secondary">
                HMAC-SHA256 Webhook Auth
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="bg-white p-4 rounded-lg border border-surface-200">
              <h4 className="text-xs font-semibold text-ink-primary uppercase tracking-wider mb-1">
                Prompt Injection Defense
              </h4>
              <p className="text-xs text-ink-muted leading-relaxed">
                Untrusted issue text is strictly quarantined within demarcation tags and processed via structured system prompts.
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-surface-200">
              <h4 className="text-xs font-semibold text-ink-primary uppercase tracking-wider mb-1">
                Least-Privilege Scopes
              </h4>
              <p className="text-xs text-ink-muted leading-relaxed">
                GitHub App tokens are scoped strictly to issues and metadata. Repository source code is never read, stored, or indexed.
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-surface-200">
              <h4 className="text-xs font-semibold text-ink-primary uppercase tracking-wider mb-1">
                Audit Trail Logging
              </h4>
              <p className="text-xs text-ink-muted leading-relaxed">
                Every approved or rejected action is timestamped and recorded in the database with user attribution and execution status.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="space-y-6">
          <div className="text-center sm:text-left space-y-1">
            <h2 className="text-xs font-semibold text-brand-600 uppercase tracking-widest font-mono">
              FAQ
            </h2>
            <h3 className="text-2xl font-bold text-ink-primary tracking-tight">
              Frequently Asked Questions
            </h3>
          </div>

          <div className="divide-y divide-surface-200 border-y border-surface-200">
            {faqs.map((faq, idx) => (
              <div key={idx} className="py-4">
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between text-left focus:outline-hidden"
                >
                  <span className="text-sm font-semibold text-ink-primary">
                    {faq.q}
                  </span>
                  {activeFaq === idx ? (
                    <ChevronUp className="w-4 h-4 text-ink-muted shrink-0 ml-2" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-ink-muted shrink-0 ml-2" />
                  )}
                </button>
                {activeFaq === idx && (
                  <p className="mt-2 text-xs sm:text-sm text-ink-muted leading-relaxed">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA Banner */}
        <div className="border border-surface-200 rounded-2xl bg-gradient-to-r from-ink-primary to-slate-900 p-8 sm:p-10 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 shadow-md">
          <div className="space-y-2 max-w-xl">
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Ready to automate your issue triage?
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Connect your GitHub repository in less than 60 seconds and experience safe, AI-assisted issue triage.
            </p>
          </div>

          <div className="shrink-0">
            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center px-6 py-3 bg-white text-ink-primary hover:bg-slate-100 font-semibold text-xs sm:text-sm rounded-lg transition-colors shadow-sm"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            ) : (
              <button
                onClick={login}
                className="inline-flex items-center px-6 py-3 bg-white text-ink-primary hover:bg-slate-100 font-semibold text-xs sm:text-sm rounded-lg transition-colors shadow-sm"
              >
                Get Started with GitHub
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-surface-200 bg-white py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-ink-muted gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-ink-primary">IssuePilot</span>
            <span>—</span>
            <span>Developer-focused, human-in-the-loop GitHub issue triage.</span>
          </div>
          <div className="flex items-center space-x-4 font-mono text-[11px]">
            <span>PostgreSQL + Prisma</span>
            <span>•</span>
            <span>Express</span>
            <span>•</span>
            <span>React 18</span>
            <span>•</span>
            <span>Gemma 2</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

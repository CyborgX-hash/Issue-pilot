import React from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { Link } from 'react-router-dom';
import {
  Tag,
  CopyCheck,
  ShieldCheck,
  Cpu,
  ArrowRight,
  GitBranch,
  Terminal,
} from 'lucide-react';

export function LandingPage() {
  const { user, login } = useAuth();

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col justify-between">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-20">
        {/* Editorial Hero */}
        <div className="space-y-4 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded bg-surface-100 border border-surface-200 text-xs font-mono text-ink-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Production-Minded GitHub Issue Triage</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink-primary leading-tight">
            Less time triaging.<br />
            More time building.
          </h1>

          <p className="text-sm sm:text-base text-ink-muted leading-relaxed">
            IssuePilot analyzes incoming GitHub issues using open-weight AI (Gemma) to classify bug reports, detect duplicates, suggest existing labels, and draft clarification requests. Every proposed action requires human approval before writing to GitHub.
          </p>

          <div className="pt-2 flex items-center space-x-3">
            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center px-4 py-2 bg-ink-primary hover:bg-ink-secondary text-white text-xs font-medium rounded transition-colors"
              >
                Go to Dashboard
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Link>
            ) : (
              <button
                onClick={login}
                className="inline-flex items-center px-4 py-2 bg-ink-primary hover:bg-ink-secondary text-white text-xs font-medium rounded transition-colors"
              >
                Connect GitHub
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </button>
            )}

            <a
              href="https://github.com/CyborgX-hash/Issue-pilot"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center px-3 py-2 border border-surface-300 hover:border-ink-muted text-ink-secondary hover:text-ink-primary text-xs font-medium rounded transition-colors bg-white"
            >
              GitHub Repository
            </a>
          </div>
        </div>

        {/* Minimal Terminal / Pipeline Preview */}
        <div className="mt-12 border border-surface-200 rounded-lg bg-white overflow-hidden shadow-sm">
          <div className="bg-surface-50 border-b border-surface-200 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-surface-300"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-surface-300"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-surface-300"></div>
              <span className="text-xs font-mono text-ink-muted pl-2">issuepilot :: triage-pipeline</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              verified human-in-the-loop
            </span>
          </div>

          <div className="p-4 sm:p-6 space-y-4 font-mono text-xs">
            <div className="flex items-start space-x-3 pb-3 border-b border-surface-100">
              <span className="text-ink-faint">01</span>
              <div>
                <span className="text-ink-primary font-semibold">Incoming Issue #42:</span>
                <span className="text-ink-secondary ml-1">"Application crashes on Stripe webhook timeout with unhandled rejection"</span>
              </div>
            </div>

            <div className="flex items-start space-x-3 pb-3 border-b border-surface-100">
              <span className="text-ink-faint">02</span>
              <div>
                <span className="text-brand-600 font-semibold">Gemma 2 AI Analysis:</span>
                <span className="text-ink-secondary ml-1">Category: BUG | Priority: HIGH | Confidence: 92%</span>
                <div className="text-ink-muted mt-1">Matched repository labels: ["bug", "priority:high"]</div>
              </div>
            </div>

            <div className="flex items-start space-x-3 pb-3 border-b border-surface-100">
              <span className="text-ink-faint">03</span>
              <div>
                <span className="text-amber-700 font-semibold">Semantic Duplicate Detector:</span>
                <span className="text-ink-secondary ml-1">Candidate #18 (87% cosine similarity, open)</span>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <span className="text-ink-faint">04</span>
              <div>
                <span className="text-emerald-700 font-semibold">Staged Review Queue:</span>
                <span className="text-ink-secondary ml-1">Action pending maintainer click to commit to GitHub API</span>
              </div>
            </div>
          </div>
        </div>

        {/* Value Principles */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="border border-surface-200 rounded p-4 bg-white">
            <Cpu className="w-4 h-4 text-ink-muted mb-2" />
            <h3 className="text-xs font-semibold text-ink-primary uppercase tracking-wider mb-1">Open-Weight AI</h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              Powered by Gemma 2 instruction models with strict Zod JSON schemas and untrusted input prompt quarantining.
            </p>
          </div>

          <div className="border border-surface-200 rounded p-4 bg-white">
            <CopyCheck className="w-4 h-4 text-ink-muted mb-2" />
            <h3 className="text-xs font-semibold text-ink-primary uppercase tracking-wider mb-1">Duplicate Discovery</h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              Vector embeddings compute cosine similarity to detect near-duplicate reports within the repository automatically.
            </p>
          </div>

          <div className="border border-surface-200 rounded p-4 bg-white">
            <ShieldCheck className="w-4 h-4 text-ink-muted mb-2" />
            <h3 className="text-xs font-semibold text-ink-primary uppercase tracking-wider mb-1">Zero Direct Writes</h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              AI proposes; maintainers approve. No labels are applied and no comments posted without explicit authenticated consent.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-surface-200 bg-white py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-ink-muted">
          <span>IssuePilot — Minimal developer-focused issue triage.</span>
          <div className="flex items-center space-x-4 mt-2 sm:mt-0 font-mono">
            <span>MySQL + Prisma</span>
            <span>•</span>
            <span>Express</span>
            <span>•</span>
            <span>React</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

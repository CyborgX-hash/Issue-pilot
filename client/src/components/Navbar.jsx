import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { api } from '../services/api.js';
import {
  GitPullRequest,
  CheckSquare,
  Settings,
  LogOut,
  FolderGit2,
  ExternalLink,
} from 'lucide-react';

export function Navbar() {
  const { user, logout, login } = useAuth();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (user) {
      api.getTriageActions({ status: 'PENDING', limit: 1 })
        .then(res => {
          if (res?.pagination?.totalCount !== undefined) {
            setPendingCount(res.pagination.totalCount);
          }
        })
        .catch(() => {});
    }
  }, [user, location.pathname]);

  const navItems = [
    { label: 'Repositories', path: '/dashboard', icon: FolderGit2 },
    { label: 'Review Queue', path: '/queue', icon: CheckSquare, badge: pendingCount },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-surface-200 bg-white/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-6">
          <Link to={user ? '/dashboard' : '/'} className="flex items-center space-x-2.5 group">
            <div className="w-6 h-6 rounded bg-ink-primary text-white flex items-center justify-center font-mono font-bold text-xs tracking-tighter">
              IP
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="font-semibold text-sm tracking-tight text-ink-primary">IssuePilot</span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-faint px-1 py-0.2 border border-surface-200 rounded">
                v1.0
              </span>
            </div>
          </Link>

          {/* Navigation tabs for authenticated users */}
          {user && (
            <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-surface-200">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-surface-100 text-ink-primary font-semibold'
                        : 'text-ink-secondary hover:text-ink-primary hover:bg-surface-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 mr-1.5 text-ink-muted" />
                    {item.label}
                    {item.badge > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-brand-50 text-brand-700 border border-brand-200 font-semibold">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* User profile / Actions */}
        <div className="flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.githubUsername}
                    className="w-6 h-6 rounded-full border border-surface-200"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-surface-200 flex items-center justify-center text-xs font-mono">
                    {user.githubUsername[0]}
                  </div>
                )}
                <span className="text-xs font-medium text-ink-secondary hidden sm:inline">
                  {user.githubUsername}
                </span>
              </div>

              <button
                onClick={logout}
                title="Sign out"
                className="p-1.5 text-ink-muted hover:text-ink-primary rounded hover:bg-surface-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={login}
              className="inline-flex items-center px-3 py-1.5 border border-ink-primary bg-ink-primary text-white text-xs font-medium rounded hover:bg-ink-secondary transition-colors"
            >
              Connect GitHub
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

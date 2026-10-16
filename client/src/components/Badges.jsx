import React from 'react';

export function CategoryBadge({ category }) {
  const styles = {
    BUG: 'bg-rose-50 text-rose-700 border-rose-200',
    FEATURE_REQUEST: 'bg-blue-50 text-blue-700 border-blue-200',
    ENHANCEMENT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    DOCUMENTATION: 'bg-amber-50 text-amber-700 border-amber-200',
    QUESTION: 'bg-purple-50 text-purple-700 border-purple-200',
    OTHER: 'bg-slate-50 text-slate-700 border-slate-200',
  };

  const currentStyle = styles[category] || styles.OTHER;
  const label = category ? category.replace('_', ' ') : 'UNKNOWN';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${currentStyle}`}>
      {label}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const styles = {
    CRITICAL: 'bg-red-50 text-red-700 border-red-300 font-semibold',
    HIGH: 'bg-amber-50 text-amber-800 border-amber-200 font-medium',
    MEDIUM: 'bg-slate-50 text-slate-700 border-slate-200',
    LOW: 'bg-gray-50 text-gray-600 border-gray-200',
  };

  const currentStyle = styles[priority] || styles.MEDIUM;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${currentStyle}`}>
      {priority || 'MEDIUM'}
    </span>
  );
}

export function StateBadge({ state }) {
  const isOpen = state === 'open';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
      isOpen
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : 'bg-purple-50 text-purple-700 border-purple-200'
    }`}>
      <span className={`w-1.5 h-1.5 mr-1.5 rounded-full ${isOpen ? 'bg-emerald-500' : 'bg-purple-500'}`}></span>
      {state ? state.toUpperCase() : 'OPEN'}
    </span>
  );
}

export function ActionBadge({ status }) {
  const styles = {
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    APPROVED: 'bg-blue-50 text-blue-700 border-blue-200',
    REJECTED: 'bg-gray-50 text-gray-500 border-gray-200 line-through',
    APPLIED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    FAILED: 'bg-red-50 text-red-700 border-red-200',
  };

  const currentStyle = styles[status] || styles.PENDING;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${currentStyle}`}>
      {status || 'PENDING'}
    </span>
  );
}

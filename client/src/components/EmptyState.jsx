import React from 'react';
import { Inbox } from 'lucide-react';

export function EmptyState({
  title = 'No records found',
  description = 'There are no items matching the current filter.',
  icon: Icon = Inbox,
  action,
}) {
  return (
    <div className="border border-dashed border-surface-200 rounded-lg p-12 text-center bg-white/50 my-4">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-surface-100 text-ink-muted mb-3 border border-surface-200">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-medium text-ink-primary mb-1">{title}</h3>
      <p className="text-xs text-ink-muted max-w-sm mx-auto mb-4">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

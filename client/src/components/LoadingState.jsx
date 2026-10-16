import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingState({ message = 'Loading data...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <Loader2 className="w-5 h-5 text-ink-muted animate-spin mb-3" />
      <span className="text-xs text-ink-muted font-mono tracking-wide">{message}</span>
    </div>
  );
}

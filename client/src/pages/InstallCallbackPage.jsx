import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api.js';
import { LoadingState } from '../components/LoadingState.jsx';
import { CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export function InstallCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [errorMessage, setErrorMessage] = useState('');

  const installationId = searchParams.get('installation_id');

  useEffect(() => {
    if (!installationId) {
      setStatus('error');
      setErrorMessage('Missing installation_id parameter from GitHub.');
      return;
    }

    api.linkInstallation(installationId)
      .then(() => {
        setStatus('success');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      })
      .catch((err) => {
        setStatus('error');
        setErrorMessage(err.message || 'Failed to link GitHub App installation.');
      });
  }, [installationId, navigate]);

  return (
    <div className="max-w-md mx-auto my-20 p-6 border border-surface-200 rounded-lg bg-white shadow-sm text-center">
      {status === 'processing' && (
        <LoadingState message="Linking GitHub App installation to your account..." />
      )}

      {status === 'success' && (
        <div className="space-y-3">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-semibold text-ink-primary">Installation Linked!</h2>
          <p className="text-xs text-ink-muted">
            GitHub App installation #{installationId} is now authorized. Redirecting to your repository list...
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-3">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-semibold text-ink-primary">Installation Error</h2>
          <p className="text-xs text-rose-600 font-mono">{errorMessage}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 inline-flex items-center px-3 py-1.5 bg-ink-primary text-white text-xs font-medium rounded hover:bg-ink-secondary"
          >
            Continue to Dashboard
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </button>
        </div>
      )}
    </div>
  );
}

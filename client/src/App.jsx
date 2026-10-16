import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import { Navbar } from './components/Navbar.jsx';
import { LandingPage } from './pages/LandingPage.jsx';
import { RepositoryListPage } from './pages/RepositoryListPage.jsx';
import { RepositoryDashboardPage } from './pages/RepositoryDashboardPage.jsx';
import { IssueExplorerPage } from './pages/IssueExplorerPage.jsx';
import { IssueDetailPage } from './pages/IssueDetailPage.jsx';
import { ReviewQueuePage } from './pages/ReviewQueuePage.jsx';
import { SettingsPage } from './pages/SettingsPage.jsx';
import { InstallCallbackPage } from './pages/InstallCallbackPage.jsx';
import { LoadingState } from './components/LoadingState.jsx';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingState message="Verifying session..." />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export function AppRoutes() {
  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      <Navbar />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <RepositoryListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/repositories/:id"
            element={
              <ProtectedRoute>
                <RepositoryDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/repositories/:id/issues"
            element={
              <ProtectedRoute>
                <IssueExplorerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/issues/:id"
            element={
              <ProtectedRoute>
                <IssueDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/queue"
            element={
              <ProtectedRoute>
                <ReviewQueuePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/install/callback"
            element={<InstallCallbackPage />}
          />
          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

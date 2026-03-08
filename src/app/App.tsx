import { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthState, signOut, validateCurrentUser } from '@/auth/auth';
import AuthCallbackPage from '@/pages/AuthCallbackPage';
import DashboardPage from '@/pages/DashboardPage';
import LoginPage from '@/pages/LoginPage';

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-500">
      Loading...
    </div>
  );
}

function ProtectedRoute({
  authenticated,
  email,
  onLogout,
}: {
  authenticated: boolean;
  email: string | null;
  onLogout: () => Promise<void>;
}) {
  if (!authenticated || !email) {
    return <Navigate to="/login" replace />;
  }

  return <DashboardPage userEmail={email} onLogout={onLogout} />;
}

function PublicLoginRoute({
  authenticated,
}: {
  authenticated: boolean;
}) {
  if (authenticated) {
    return <Navigate to="/" replace />;
  }

  return <LoginPage />;
}

export default function App() {
  const [authState, setAuthState] = useState<AuthState>({
    authenticated: false,
    email: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        const result = await validateCurrentUser();
        setAuthState(result);
      } catch (error) {
        console.error('validateCurrentUser error:', error);
        setAuthState({
          authenticated: false,
          email: null,
        });
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('signOut error:', error);
    } finally {
      setAuthState({
        authenticated: false,
        email: null,
      });
    }
  };

  const basename = useMemo(() => {
    const base = import.meta.env.BASE_URL ?? '/';
    if (base === '/' || base === '') {
      return undefined;
    }
    return base.endsWith('/') ? base.slice(0, -1) : base;
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route
          path="/login"
          element={<PublicLoginRoute authenticated={authState.authenticated} />}
        />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute
              authenticated={authState.authenticated}
              email={authState.email}
              onLogout={handleLogout}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
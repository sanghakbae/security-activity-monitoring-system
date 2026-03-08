import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { signInWithGoogle, signOut, validateCurrentUser } from '@/auth/auth';
import type { AuthState } from '@/auth/auth';
import AuthCallbackPage from '@/pages/AuthCallbackPage';
import DashboardPage from '@/pages/DashboardPage';
import LoginPage from '@/pages/LoginPage';

export default function App() {
  const [authState, setAuthState] = useState<AuthState>({
    authenticated: false,
    email: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const result = await validateCurrentUser();
        setAuthState(result);
      } catch (error) {
        console.error(error);
        setAuthState({
          authenticated: false,
          email: null,
        });
      } finally {
        setLoading(false);
      }
    };

    void check();
  }, []);

  const handleLogin = async () => {
    try {
      const result = await signInWithGoogle();

      if (result.authenticated) {
        setAuthState(result);
      }
    } catch (error) {
      console.error(error);
      window.alert('로그인 중 오류가 발생했습니다.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error(error);
    } finally {
      setAuthState({
        authenticated: false,
        email: null,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-500">
        Loading...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        <Route
          path="/"
          element={
            authState.authenticated && authState.email ? (
              <DashboardPage userEmail={authState.email} onLogout={handleLogout} />
            ) : (
              <LoginPage onLogin={handleLogin} />
            )
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
import { useEffect } from 'react';
import { handleAuthCallback } from '@/auth/auth';

export default function AuthCallbackPage() {
  useEffect(() => {
    void handleAuthCallback().catch((error) => {
      console.error(error);
      window.alert('로그인 처리 중 오류가 발생했습니다.');
      window.location.replace('/');
    });
  }, []);

  return <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-500">로그인 처리 중...</div>;
}

import { AuthState, signInWithGoogle, validateCurrentUser } from '@/auth/auth';

type LoginPageProps = {
  onLogin: (state: AuthState) => void;
};

export default function LoginPage({ onLogin }: LoginPageProps) {
  const handleLogin = async () => {
    try {
      await signInWithGoogle();

      const authState = await validateCurrentUser();
      onLogin(authState);
    } catch (error) {
      console.error('signInWithGoogle error:', error);
      window.alert(
        error instanceof Error ? `로그인 오류: ${error.message}` : '로그인 중 오류가 발생했습니다.',
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white px-8 py-10 shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">보안 활동 모니터링 시스템</h1>
          <p className="mt-3 text-sm text-slate-500">Google 계정으로 로그인하세요</p>
        </div>

        <button
          type="button"
          onClick={handleLogin}
          className="mt-8 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Google 로그인
        </button>
      </div>
    </div>
  );
}
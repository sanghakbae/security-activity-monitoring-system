type LoginPageProps = {
  onLogin: () => void;
};

export default function LoginPage({ onLogin }: LoginPageProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-[500px] rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <h1 className="mb-2 text-[32px] font-bold tracking-tight text-slate-900">보안 활동 모니터링 시스템</h1>
        <p className="mb-8 text-lg text-slate-500">Google 계정으로 로그인하세요</p>

        <button
          type="button"
          onClick={onLogin}
          className="w-full rounded-xl bg-slate-900 py-4 text-lg font-semibold text-white transition hover:bg-slate-800"
        >
          Google 로그인
        </button>

        <p className="mt-6 text-sm text-slate-400">muhayu.com 계정만 허용됩니다</p>
      </div>
    </div>
  );
}

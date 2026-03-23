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
    <div className="flex min-h-screen items-center justify-center bg-[#dfe4ec] px-4 py-7 sm:px-6 sm:py-10">
      <div className="w-full max-w-[860px] overflow-hidden rounded-[42px] border border-[#d9dee7] bg-white shadow-[0_22px_55px_rgba(15,23,42,0.09)]">
        <div className="bg-[#f3f5f9] px-6 pb-9 pt-8 sm:px-12 sm:pb-12 sm:pt-10">
          <div className="inline-flex items-center rounded-full border border-[#d2d9e4] bg-[#f6f8fb] px-4 py-2 text-[14px] font-semibold tracking-[0.12em] text-[#6f7f98] sm:px-5 sm:text-[16px]">
            VULNERABILITY MANAGEMENT
          </div>
          <h1 className="mt-7 text-[44px] font-semibold leading-[1.2] text-[#111827] sm:text-[54px]">
            취약점 관리 시스템
          </h1>
          <p className="mt-5 text-[24px] text-[#6f7d93] sm:text-[40px]">
            허용된 Google 계정으로 로그인하세요.
          </p>
        </div>

        <div className="border-t border-[#eaedf2] px-6 pb-8 pt-6 sm:px-12 sm:pb-12 sm:pt-8">
          <div className="rounded-[28px] border border-[#d5dce7] bg-[#f7f9fc] px-6 py-5 sm:px-8 sm:py-6">
            <p className="text-[22px] font-medium text-[#75839a] sm:text-[34px]">로그인 방식</p>
            <p className="mt-2 text-[20px] text-[#5f6f88] sm:text-[36px]">
              Google OAuth<span className="mx-2">·</span>허용 도메인
              <span className="mx-2 text-[#7b899f]">`muhayu.com`, `gmail.com`</span>
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogin}
            className="mt-7 flex w-full items-center justify-center gap-3 rounded-[30px] bg-[#000927] px-5 py-4 text-[22px] font-semibold text-white transition hover:bg-[#081437] sm:mt-8 sm:py-5 sm:text-[42px]"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[22px] font-semibold leading-none text-[#1a2337] sm:h-14 sm:w-14 sm:text-[32px]">
              G
            </span>
            <span>Google 계정으로 로그인</span>
          </button>

          <p className="mt-7 text-center text-[17px] text-[#a4aec0] sm:mt-8 sm:text-[30px]">
            로그인되지 않으면 관리자에게 계정 허용 여부를 확인하세요.
          </p>
        </div>
      </div>
    </div>
  );
}

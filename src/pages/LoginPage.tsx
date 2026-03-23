import { useEffect, useState } from 'react';
import { AuthState, signInWithGoogle, validateCurrentUser } from '@/auth/auth';
import { ALLOWED_DOMAIN } from '@/lib/env';
import { supabase } from '@/lib/supabase';

type LoginPageProps = {
  onLogin: (state: AuthState) => void;
};

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [allowedDomainText, setAllowedDomainText] = useState<string>(`'${ALLOWED_DOMAIN}'`);

  const formatAllowedDomainText = (value: string) => {
    const unique = Array.from(
      new Set(
        value
          .split(',')
          .map((item) => item.trim().toLowerCase())
          .filter((item) => item !== ''),
      ),
    );

    if (unique.length === 0) {
      return `'${ALLOWED_DOMAIN}'`;
    }

    return unique.map((domain) => `'${domain}'`).join(', ');
  };

  useEffect(() => {
    const loadAllowedDomain = async () => {
      if (!supabase) return;

      const { data, error } = await supabase
        .from('security_setting')
        .select('allowed_email_domain')
        .order('created_at', { ascending: true })
        .limit(1);

      if (error) {
        console.error('security_setting load for login error:', error);
        return;
      }

      const domain = data?.[0]?.allowed_email_domain;
      if (typeof domain === 'string' && domain.trim() !== '') {
        setAllowedDomainText(formatAllowedDomainText(domain));
      }
    };

    void loadAllowedDomain();
  }, []);

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
      <div className="w-full max-w-[430px] overflow-hidden rounded-[20px] border border-[#d9dee7] bg-white shadow-[0_10px_20px_rgba(15,23,42,0.07)]">
        <div className="bg-[#f3f5f9] px-4 pb-4 pt-4 sm:px-5 sm:pb-5 sm:pt-5">
          <div className="inline-flex items-center rounded-full border border-[#d2d9e4] bg-[#f6f8fb] px-3 py-1.5 text-[12px] font-semibold tracking-[0.1em] text-[#6f7f98] sm:px-3.5 sm:text-[13px]">
            security activity monitoring system
          </div>
          <h1 className="mt-4 text-[16px] font-semibold leading-[1.2] text-[#111827] sm:text-[18px]">
            보안 활동 모니터링 시스템
          </h1>
          <p className="mt-3 text-[11px] text-[#6f7d93] sm:text-[12px]">
            허용된 Google 계정으로 로그인하세요.
          </p>
        </div>

        <div className="border-t border-[#eaedf2] px-4 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4">
          <div className="rounded-[14px] border border-[#d5dce7] bg-[#f7f9fc] px-3.5 py-2.5 sm:px-4 sm:py-3">
            <p className="text-[11px] font-medium text-[#75839a] sm:text-[12px]">로그인 방식</p>
            <p className="mt-1 text-[10px] text-[#5f6f88] sm:text-[11px]">
              Google OAuth<span className="mx-2">·</span>허용 도메인
              <span className="mx-2 text-[#7b899f]">{allowedDomainText}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogin}
            className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-[14px] bg-[#000927] px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-[#081437] sm:mt-4 sm:py-2 sm:text-[12px]"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-[12px] font-semibold leading-none text-[#1a2337] sm:h-7 sm:w-7 sm:text-[13px]">
              G
            </span>
            <span>Google 계정으로 로그인</span>
          </button>

          <p className="mt-4 text-center text-[11px] text-[#a4aec0] sm:mt-5 sm:text-[12px]">
            로그인되지 않으면 관리자에게 계정 허용 여부를 확인하세요.
          </p>
        </div>
      </div>
    </div>
  );
}

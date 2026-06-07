import { useEffect, useState } from 'react';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { AuthState, signInWithGoogle, validateCurrentUser } from '@/auth/auth';
import { ALLOWED_DOMAIN, ALLOWED_EMAILS } from '@/lib/env';
import { db } from '@/lib/firebase';

type LoginPageProps = {
  onLogin: (state: AuthState) => void;
};

export default function LoginPage({ onLogin }: LoginPageProps) {
  const noRestrictionText = '모든 Google 계정';
  // An exact-email allowlist (if configured) takes priority over the domain.
  const initialAllowedText =
    ALLOWED_EMAILS.length > 0
      ? ALLOWED_EMAILS.join(', ')
      : ALLOWED_DOMAIN
        ? `'${ALLOWED_DOMAIN}'`
        : noRestrictionText;
  const [submitting, setSubmitting] = useState(false);
  const [allowedDomainText, setAllowedDomainText] = useState<string>(
    initialAllowedText,
  );

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
      return ALLOWED_DOMAIN ? `'${ALLOWED_DOMAIN}'` : noRestrictionText;
    }

    return unique.map((domain) => `'${domain}'`).join(', ');
  };

  useEffect(() => {
    // An email allowlist overrides domain display — don't fetch/clobber it.
    if (ALLOWED_EMAILS.length > 0) return;

    const loadAllowedDomain = async () => {
      if (!db) return;

      try {
        const snapshot = await getDocs(
          query(collection(db, 'security_setting'), orderBy('created_at', 'asc'), limit(1)),
        );

        const domain = snapshot.docs[0]?.data()?.allowed_email_domain;
        if (typeof domain === 'string' && domain.trim() !== '') {
          setAllowedDomainText(formatAllowedDomainText(domain));
        }
      } catch (error) {
        console.error('security_setting load for login error:', error);
      }
    };

    void loadAllowedDomain();
  }, []);

  const handleLogin = async () => {
    setSubmitting(true);
    try {
      await signInWithGoogle();

      const authState = await validateCurrentUser();
      onLogin(authState);
      // On success the app navigates away; keep the spinner until then.
      if (!authState.authenticated) {
        setSubmitting(false);
      }
    } catch (error) {
      console.error('signInWithGoogle error:', error);
      setSubmitting(false);
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
            disabled={submitting}
            className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-[14px] bg-[#000927] px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-[#081437] disabled:cursor-not-allowed disabled:opacity-60 sm:mt-4 sm:py-2 sm:text-[12px]"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-[12px] font-semibold leading-none text-[#1a2337] sm:h-7 sm:w-7 sm:text-[13px]">
              G
            </span>
            <span>{submitting ? '로그인 처리 중…' : 'Google 계정으로 로그인'}</span>
          </button>

          <p className="mt-4 text-center text-[11px] text-[#a4aec0] sm:mt-5 sm:text-[12px]">
            로그인되지 않으면 관리자에게 계정 허용 여부를 확인하세요.
          </p>
        </div>
      </div>
    </div>
  );
}

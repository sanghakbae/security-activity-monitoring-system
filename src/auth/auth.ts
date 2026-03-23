import { supabase } from '@/lib/supabase';
import { ALLOWED_DOMAIN, AUTH_MODE } from '@/lib/env';

export type AuthState = {
  authenticated: boolean;
  email: string | null;
};

type RuntimeSecuritySettings = {
  allowedEmailDomains: string[];
  sessionTimeoutMinutes: number;
};

const defaultRuntimeSecuritySettings: RuntimeSecuritySettings = {
  allowedEmailDomains: [ALLOWED_DOMAIN],
  sessionTimeoutMinutes: 60,
};

function parseAllowedEmailDomains(value: unknown): string[] {
  if (typeof value !== 'string') {
    return [];
  }

  const unique = Array.from(
    new Set(
      value
        .split(',')
        .map((item) => item.trim().toLowerCase())
        .filter((item) => item !== ''),
    ),
  );

  return unique;
}

function getBaseUrl() {
  if (typeof window === 'undefined') {
    return '';
  }

  const base = import.meta.env.BASE_URL ?? '/';
  const normalizedBase =
    base === '/' || base === '' ? '' : base.endsWith('/') ? base.slice(0, -1) : base;
  return `${window.location.origin}${normalizedBase}`;
}

function decodeJwtPayload(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;

    const payload = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(parts[1].length / 4) * 4, '=');

    const decoded = atob(payload);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch (error) {
    console.error('decodeJwtPayload error:', error);
    return null;
  }
}

async function loadRuntimeSecuritySettings(): Promise<RuntimeSecuritySettings> {
  if (!supabase) {
    return defaultRuntimeSecuritySettings;
  }

  const { data, error } = await supabase
    .from('security_setting')
    .select('allowed_email_domain, session_timeout_minutes')
    .order('created_at', { ascending: true })
    .limit(1);

  if (error) {
    console.error('security_setting load for auth error:', error);
    return defaultRuntimeSecuritySettings;
  }

  const row = (data ?? [])[0];
  if (!row) {
    return defaultRuntimeSecuritySettings;
  }

  return {
    allowedEmailDomains:
      parseAllowedEmailDomains(row.allowed_email_domain).length > 0
        ? parseAllowedEmailDomains(row.allowed_email_domain)
        : defaultRuntimeSecuritySettings.allowedEmailDomains,
    sessionTimeoutMinutes:
      typeof row.session_timeout_minutes === 'number' && row.session_timeout_minutes > 0
        ? row.session_timeout_minutes
        : defaultRuntimeSecuritySettings.sessionTimeoutMinutes,
  };
}

export async function signInWithGoogle() {
  if (AUTH_MODE === 'mock') {
    return;
  }

  if (!supabase) {
    throw new Error('Supabase client is not initialized.');
  }

  const runtimeSettings = await loadRuntimeSecuritySettings();
  const redirectTo = `${getBaseUrl()}/auth/callback`;
  const primaryDomain = runtimeSettings.allowedEmailDomains[0] ?? ALLOWED_DOMAIN;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        hd: primaryDomain,
        prompt: 'select_account',
      },
    },
  });

  if (error) {
    throw error;
  }
}

export async function signOut() {
  if (AUTH_MODE === 'mock') {
    return;
  }

  if (!supabase) {
    return;
  }

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

export async function getSession() {
  if (AUTH_MODE === 'mock') {
    return {
      session: {
        user: {
          email: `test@${ALLOWED_DOMAIN}`,
        },
      },
    };
  }

  if (!supabase) {
    return { session: null };
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return { session };
}

export async function validateCurrentUser(): Promise<AuthState> {
  const { session } = await getSession();

  if (!session?.user?.email) {
    return {
      authenticated: false,
      email: null,
    };
  }

  const email = session.user.email;
  const domain = email.split('@')[1]?.toLowerCase() ?? '';
  const runtimeSettings = await loadRuntimeSecuritySettings();

  if (!runtimeSettings.allowedEmailDomains.includes(domain)) {
    await signOut();

    return {
      authenticated: false,
      email: null,
    };
  }

  const timeoutSeconds = runtimeSettings.sessionTimeoutMinutes * 60;
  const accessToken =
    session && typeof session === 'object' && 'access_token' in session
      ? String((session as { access_token?: string }).access_token ?? '')
      : '';
  const payload = decodeJwtPayload(accessToken);
  const iat =
    payload && typeof payload.iat === 'number'
      ? payload.iat
      : payload && typeof payload.iat === 'string'
        ? Number(payload.iat)
        : null;

  if (iat && Number.isFinite(iat)) {
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (nowSeconds - iat > timeoutSeconds) {
      await signOut();
      return {
        authenticated: false,
        email: null,
      };
    }
  }

  return {
    authenticated: true,
    email,
  };
}

export async function handleAuthCallback(): Promise<AuthState> {
  return validateCurrentUser();
}

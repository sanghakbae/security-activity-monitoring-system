import { ALLOWED_DOMAIN, AUTH_MODE } from '@/lib/env';
import { supabase } from '@/lib/supabase';

export type AuthState = {
  authenticated: boolean;
  email: string | null;
};

function isAllowedEmail(email?: string | null): boolean {
  return Boolean(email && email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`));
}

export async function signInWithGoogle(): Promise<AuthState> {
  if (AUTH_MODE === 'mock' || !supabase) {
    return {
      authenticated: true,
      email: `user@${ALLOWED_DOMAIN}`,
    };
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        hd: ALLOWED_DOMAIN,
        prompt: 'select_account',
      },
    },
  });

  if (error) {
    throw error;
  }

  return {
    authenticated: false,
    email: null,
  };
}

export async function signOut(): Promise<void> {
  if (AUTH_MODE === 'mock' || !supabase) {
    return;
  }

  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}

export async function validateCurrentUser(): Promise<AuthState> {
  if (AUTH_MODE === 'mock' || !supabase) {
    return {
      authenticated: false,
      email: null,
    };
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }

  const session = data.session;
  const email = session?.user?.email ?? null;

  if (!session || !email) {
    return {
      authenticated: false,
      email: null,
    };
  }

  if (!isAllowedEmail(email)) {
    await supabase.auth.signOut();
    throw new Error(`${ALLOWED_DOMAIN} 계정만 접근할 수 있습니다.`);
  }

  return {
    authenticated: true,
    email,
  };
}

export async function handleAuthCallback(): Promise<void> {
  if (!supabase) {
    window.location.replace('/');
    return;
  }

  const hash = window.location.hash;
  if (!hash) {
    window.location.replace('/');
    return;
  }

  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');

  if (!access_token || !refresh_token) {
    window.location.replace('/');
    return;
  }

  const { error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });

  if (error) {
    throw error;
  }

  const { data } = await supabase.auth.getUser();
  const email = data.user?.email ?? null;

  if (!isAllowedEmail(email)) {
    await supabase.auth.signOut();
    window.alert(`${ALLOWED_DOMAIN} 계정만 접근할 수 있습니다.`);
    window.location.replace('/');
    return;
  }

  window.location.replace('/');
}
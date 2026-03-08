import { supabase } from '@/lib/supabase';
import { ALLOWED_DOMAIN, AUTH_MODE } from '@/lib/env';

const APP_BASE_PATH = '/security-activity-monitoring-system';

export type AuthState = {
  authenticated: boolean;
  email: string | null;
};

function getBaseUrl() {
  if (typeof window === 'undefined') {
    return '';
  }

  if (import.meta.env.PROD) {
    return `${window.location.origin}${APP_BASE_PATH}`;
  }

  return window.location.origin;
}

export async function signInWithGoogle() {
  if (AUTH_MODE === 'mock') {
    return;
  }

  if (!supabase) {
    throw new Error('Supabase client is not initialized.');
  }

  const redirectTo = `${getBaseUrl()}/`;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        hd: ALLOWED_DOMAIN,
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

  if (domain !== ALLOWED_DOMAIN.toLowerCase()) {
    await signOut();

    return {
      authenticated: false,
      email: null,
    };
  }

  return {
    authenticated: true,
    email,
  };
}

export async function handleAuthCallback(): Promise<AuthState> {
  return validateCurrentUser();
}
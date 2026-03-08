import { supabase } from '@/lib/supabase';
import { ALLOWED_DOMAIN, AUTH_MODE } from '@/lib/env';

const APP_BASE_PATH = '/security-activity-monitoring-system';

function getAppBaseUrl() {
  if (typeof window === 'undefined') {
    return '';
  }

  const origin = window.location.origin;

  if (import.meta.env.PROD) {
    return `${origin}${APP_BASE_PATH}`;
  }

  return origin;
}

export async function signInWithGoogle() {
  if (AUTH_MODE === 'mock') {
    return;
  }

  if (!supabase) {
    throw new Error('Supabase client is not initialized.');
  }

  const redirectTo = `${getAppBaseUrl()}/auth/callback`;

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
    throw new Error('Supabase client is not initialized.');
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

export async function validateCurrentUser() {
  const { session } = await getSession();

  if (!session?.user?.email) {
    return {
      authenticated: false,
      email: null,
    };
  }

  const email = session.user.email;
  const domain = email.split('@')[1]?.toLowerCase() ?? '';
  const allowedDomain = ALLOWED_DOMAIN.toLowerCase();

  if (domain !== allowedDomain) {
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
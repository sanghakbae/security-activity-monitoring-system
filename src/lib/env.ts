type AuthMode = 'supabase' | 'mock';

function readEnv(name: string, fallback = '') {
  return import.meta.env[name] ?? fallback;
}

export const VITE_SUPABASE_URL = readEnv('VITE_SUPABASE_URL');
export const VITE_SUPABASE_ANON_KEY = readEnv('VITE_SUPABASE_ANON_KEY');

export const AUTH_MODE: AuthMode =
  readEnv('VITE_AUTH_MODE', 'supabase') === 'mock' ? 'mock' : 'supabase';

export const ALLOWED_DOMAIN = readEnv('VITE_ALLOWED_DOMAIN', 'muhayu.com');

export const env = {
  supabaseUrl: VITE_SUPABASE_URL,
  supabaseAnonKey: VITE_SUPABASE_ANON_KEY,
  authMode: AUTH_MODE,
  allowedDomain: ALLOWED_DOMAIN,
};

export function hasSupabaseEnv() {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}
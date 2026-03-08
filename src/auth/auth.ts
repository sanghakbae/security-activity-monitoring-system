import { supabase } from '@/lib/supabase'
import { ALLOWED_DOMAIN, AUTH_MODE } from '@/lib/env'

const APP_BASE_PATH = '/security-activity-monitoring-system'

export type AuthState = {
  authenticated: boolean
  email: string | null
}

function getBaseUrl() {
  if (import.meta.env.PROD) {
    return `${window.location.origin}${APP_BASE_PATH}`
  }
  return window.location.origin
}

export async function signInWithGoogle() {
  if (!supabase) throw new Error('Supabase not initialized')

  const redirectTo = `${getBaseUrl()}/auth/callback`

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        hd: ALLOWED_DOMAIN
      }
    }
  })

  if (error) throw error
}

export async function signOut() {
  if (!supabase) return
  await supabase.auth.signOut()
}

export async function handleAuthCallback(): Promise<AuthState> {
  if (!supabase) {
    return { authenticated: false, email: null }
  }

  const {
    data: { session }
  } = await supabase.auth.getSession()

  if (!session?.user?.email) {
    return { authenticated: false, email: null }
  }

  const email = session.user.email
  const domain = email.split('@')[1]

  if (domain !== ALLOWED_DOMAIN) {
    await signOut()
    return { authenticated: false, email: null }
  }

  return {
    authenticated: true,
    email
  }
}
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { ALLOWED_DOMAIN, ALLOWED_EMAILS, AUTH_MODE } from '@/lib/env';

export type AuthState = {
  authenticated: boolean;
  email: string | null;
};

type RuntimeSecuritySettings = {
  allowedEmailDomains: string[];
  sessionTimeoutMinutes: number;
};

// Empty allowedEmailDomains → no domain restriction (any Google account).
const defaultRuntimeSecuritySettings: RuntimeSecuritySettings = {
  allowedEmailDomains: ALLOWED_DOMAIN ? [ALLOWED_DOMAIN] : [],
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

async function loadRuntimeSecuritySettings(): Promise<RuntimeSecuritySettings> {
  if (!db) {
    return defaultRuntimeSecuritySettings;
  }

  try {
    const snapshot = await getDocs(
      query(collection(db, 'security_setting'), orderBy('created_at', 'asc'), limit(1)),
    );

    const row = snapshot.docs[0]?.data();
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
  } catch (error) {
    console.error('security_setting load for auth error:', error);
    return defaultRuntimeSecuritySettings;
  }
}

/**
 * Resolve the current Firebase user once the SDK has finished restoring the
 * persisted session. onAuthStateChanged fires with the initial state, after
 * which we immediately unsubscribe.
 */
function waitForAuthUser(): Promise<User | null> {
  const authInstance = auth;
  if (!authInstance) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(
      authInstance,
      (user) => {
        unsubscribe();
        resolve(user);
      },
      () => {
        unsubscribe();
        resolve(null);
      },
    );
  });
}

export async function signInWithGoogle() {
  if (AUTH_MODE === 'mock') {
    return;
  }

  if (!auth) {
    throw new Error('Firebase Auth가 초기화되지 않았습니다.');
  }

  // Use the env-configured domain only as an optional account-picker hint. The
  // actual domain/email enforcement happens post-login in validateCurrentUser,
  // so we avoid an unauthenticated Firestore read here (which the rules deny).
  const primaryDomain = ALLOWED_DOMAIN;

  const provider = new GoogleAuthProvider();
  // Only hint a Workspace domain when one is configured; otherwise allow any
  // Google account in the picker.
  provider.setCustomParameters(
    primaryDomain
      ? { hd: primaryDomain, prompt: 'select_account' }
      : { prompt: 'select_account' },
  );

  // Popup avoids the third-party-cookie / storage-partitioning issues that
  // break signInWithRedirect when the app origin (localhost / GitHub Pages)
  // differs from the Firebase auth handler domain.
  await signInWithPopup(auth, provider);
}

export async function signOut() {
  if (AUTH_MODE === 'mock') {
    return;
  }

  if (!auth) {
    return;
  }

  await firebaseSignOut(auth);
}

export async function validateCurrentUser(): Promise<AuthState> {
  if (AUTH_MODE === 'mock') {
    return {
      authenticated: true,
      email: `test@${ALLOWED_DOMAIN || 'example.com'}`,
    };
  }

  if (!auth) {
    return { authenticated: false, email: null };
  }

  // Sign-in uses signInWithPopup, so on app load we simply resolve the
  // persisted session via onAuthStateChanged.
  const user = await waitForAuthUser();

  if (!user?.email) {
    return {
      authenticated: false,
      email: null,
    };
  }

  const email = user.email;
  const domain = email.split('@')[1]?.toLowerCase() ?? '';

  // Exact-email allowlist takes priority. When set, only these accounts pass.
  if (ALLOWED_EMAILS.length > 0 && !ALLOWED_EMAILS.includes(email.toLowerCase())) {
    await signOut();

    return {
      authenticated: false,
      email: null,
    };
  }

  const runtimeSettings = await loadRuntimeSecuritySettings();

  // Empty allowedEmailDomains means no restriction — allow any domain.
  if (
    runtimeSettings.allowedEmailDomains.length > 0 &&
    !runtimeSettings.allowedEmailDomains.includes(domain)
  ) {
    await signOut();

    return {
      authenticated: false,
      email: null,
    };
  }

  const timeoutSeconds = runtimeSettings.sessionTimeoutMinutes * 60;

  try {
    const tokenResult = await user.getIdTokenResult();
    const authTimeSeconds = Math.floor(new Date(tokenResult.authTime).getTime() / 1000);

    if (Number.isFinite(authTimeSeconds)) {
      const nowSeconds = Math.floor(Date.now() / 1000);
      if (nowSeconds - authTimeSeconds > timeoutSeconds) {
        await signOut();
        return {
          authenticated: false,
          email: null,
        };
      }
    }
  } catch (error) {
    console.error('id token resolve error:', error);
  }

  return {
    authenticated: true,
    email,
  };
}

export async function handleAuthCallback(): Promise<AuthState> {
  // validateCurrentUser() now resolves the pending redirect itself.
  return validateCurrentUser();
}

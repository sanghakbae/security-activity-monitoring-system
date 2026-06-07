import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithRedirect,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
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

  const runtimeSettings = await loadRuntimeSecuritySettings();
  const primaryDomain = runtimeSettings.allowedEmailDomains[0] ?? ALLOWED_DOMAIN;

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    hd: primaryDomain,
    prompt: 'select_account',
  });

  await signInWithRedirect(auth, provider);
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
      email: `test@${ALLOWED_DOMAIN}`,
    };
  }

  if (!auth) {
    return { authenticated: false, email: null };
  }

  const user = await waitForAuthUser();

  if (!user?.email) {
    return {
      authenticated: false,
      email: null,
    };
  }

  const email = user.email;
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
  if (auth) {
    try {
      await getRedirectResult(auth);
    } catch (error) {
      console.error('getRedirectResult error:', error);
    }
  }

  return validateCurrentUser();
}

import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';
import type { Database } from './types';
import { store, type Profile } from '../store';

export function createSupabaseServerClient(request: Request) {
  const headers = new Headers();

  const supabaseUrl = process.env.SUPABASE_URL || 'https://sandbox.supabase.co';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'sandbox_anon_key_mock_fallback';

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get('Cookie') ?? '').map((c) => ({
          name: c.name,
          value: c.value ?? '',
        }));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          headers.append('Set-Cookie', serializeCookieHeader(name, value, options))
        );
      },
    },
  });

  return { supabase, headers };
}

export interface SessionContext {
  user: Profile | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  isImpersonating: boolean;
  isApproved: boolean;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  impersonatedBy?: string;
}

/**
 * Resolves current user session from cookie or returns unauthenticated context
 */
export async function getSessionContext(request: Request): Promise<SessionContext> {
  const cookieHeader = request.headers.get('Cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader
      .split(';')
      .map((c) => c.trim().split('='))
      .filter(([k]) => !!k)
  );

  const impersonateUserId = cookies['tatadana_impersonate'];
  const sessionToken = cookies['tatadana_session'];
  const sessionUserId = cookies['tatadana_session_user'];

  let effectiveUserId: string | null = null;

  // Validate session token strictly if available in store.sessions
  if (sessionToken && typeof store.getSession === 'function') {
    const validSession = store.getSession(sessionToken);
    if (validSession) {
      effectiveUserId = validSession.user_id;
    }
  } else if (!sessionToken && sessionUserId && store.sessions.size === 0) {
    // Fallback for initial seeding or testing where sessions map is bypassed
    effectiveUserId = sessionUserId;
  }

  if (!effectiveUserId) {
    return {
      user: null,
      isAdmin: false,
      isAuthenticated: false,
      isImpersonating: false,
      isApproved: false,
      verificationStatus: 'pending',
    };
  }

  // Check if admin is impersonating
  if (impersonateUserId && store.profiles.has(impersonateUserId)) {
    const targetUser = store.profiles.get(impersonateUserId)!;
    return {
      user: targetUser,
      isAdmin: false,
      isAuthenticated: true,
      isImpersonating: true,
      isApproved: targetUser.verification_status === 'approved',
      verificationStatus: targetUser.verification_status || 'approved',
      impersonatedBy: effectiveUserId,
    };
  }

  // Resolve session user
  const user = store.profiles.get(effectiveUserId) || null;
  if (!user) {
    return {
      user: null,
      isAdmin: false,
      isAuthenticated: false,
      isImpersonating: false,
      isApproved: false,
      verificationStatus: 'pending',
    };
  }

  const isAdmin = user.role === 'superadmin' || user.role === 'admin' || (user as any)?.is_admin === true || (user as any)?.isAdmin === true;
  const isApproved = isAdmin || user.verification_status === 'approved';

  return {
    user,
    isAdmin,
    isAuthenticated: true,
    isImpersonating: false,
    isApproved,
    verificationStatus: user.verification_status || (isAdmin ? 'approved' : 'pending'),
  };
}

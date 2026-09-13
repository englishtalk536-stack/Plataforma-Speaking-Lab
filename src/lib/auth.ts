import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth-options';

export const LOCAL_DEV_USER_ID = '00000000-0000-0000-0000-000000000010';

/**
 * Resolves the authenticated student's userId for the current request.
 *
 * ⚠️ PLACEHOLDER: no auth provider has been specified for SpeakingLab yet.
 * This reads a plain `x-user-id` header (handy for local testing with curl
 * or Postman) and falls back to nothing. Before shipping, replace this with
 * real session verification — e.g. `getServerSession()` (NextAuth),
 * `supabase.auth.getUser()`, or your session-cookie/JWT of choice — and
 * make sure the resolved id can't be spoofed by the client.
 */
export async function getCurrentUserId(request: Request | NextRequest): Promise<string | null> {
  const headerUserId = request.headers.get('x-user-id');
  if (process.env.NODE_ENV !== 'production' && headerUserId && headerUserId.trim().length > 0) {
    return headerUserId.trim();
  }

  if (process.env.NODE_ENV !== 'production') {
    return process.env.LOCAL_USER_ID?.trim() || LOCAL_DEV_USER_ID;
  }

  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

export type AppRole = 'STUDENT' | 'TEACHER' | 'ADMIN';

export const roleLabels: Record<AppRole, string> = {
  STUDENT: 'Student',
  TEACHER: 'Teacher',
  ADMIN: 'Admin',
};

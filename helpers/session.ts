'use server';

import { cookies } from 'next/headers';

export interface ISessionData {
  userId?: number;
  role?: string;
  email?: string;
  name?: string;
}

export async function createSession(data: ISessionData) {
  const cookieStore = await cookies();

  cookieStore.set('userSession', JSON.stringify(data), {
    path: '/',
    expires: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false, // Allow client-side access for dashboard functionality
    sameSite: 'lax',
  });

  return 'Session created';
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete('userSession');
  return 'Session deleted';
}

export async function getSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('userSession');

  if (!sessionCookie) return null;

  try {
    return JSON.parse(sessionCookie.value);
  } catch {
    return null;
  }
}

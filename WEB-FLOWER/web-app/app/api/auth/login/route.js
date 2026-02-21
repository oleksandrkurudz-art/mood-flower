import { NextResponse } from 'next/server';

export async function POST(request) {
  const body = await request.json();
  const login = process.env.ADMIN_LOGIN || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'change-me';
  if (body.login !== login || body.password !== password) return NextResponse.json({ error: 'invalid credentials' }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set('admin_auth', '1', { httpOnly: true, sameSite: 'lax', path: '/' });
  return res;
}

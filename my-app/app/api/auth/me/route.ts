import { NextResponse } from 'next/server';
import { forwardedFor, proxyJson } from '../../../../lib/proxy';

export async function GET(request: Request) {
  const authorization = request.headers.get('authorization');

  if (!authorization) {
    return NextResponse.json(
      { authenticated: false, error: 'Avtorizatsiya talab qilinadi' },
      { status: 401 }
    );
  }

  // Profil tokendagi `sub` bo'yicha backenddan olinadi — demo foydalanuvchi qaytarilmaydi.
  const { status, body } = await proxyJson('/api/auth/me', {
    method: 'GET',
    headers: { authorization, ...forwardedFor(request) },
  });

  return NextResponse.json(body, { status });
}

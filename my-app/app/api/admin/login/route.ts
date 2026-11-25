import { NextResponse } from 'next/server';
import { forwardedFor, proxyJson } from '../../../../lib/proxy';

export async function POST(request: Request) {
  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "So'rov formati noto'g'ri" }, { status: 400 });
  }

  const username = (body.username || body.email || body.login || '').trim();
  const password = (body.password || '').trim();

  if (!username || !password) {
    return NextResponse.json(
      { error: 'Admin login va parol kiritilishi shart' },
      { status: 400 }
    );
  }

  // Rol tekshiruvi faqat backendda: UI dagi tekshiruv himoya emas.
  const { status, body: data } = await proxyJson('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
    headers: forwardedFor(request),
  });

  return NextResponse.json(data, { status });
}

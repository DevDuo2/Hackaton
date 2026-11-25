import { NextResponse } from 'next/server';
import { forwardedFor, proxyJson } from '../../../../lib/proxy';

const MIN_PASSWORD_LENGTH = 6;

export async function POST(request: Request) {
  let body: { name?: string; email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "So'rov formati noto'g'ri" }, { status: 400 });
  }

  const name = (body.name || '').trim();
  const email = (body.email || '').toLowerCase().trim();
  const password = body.password || '';

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "Barcha maydonlarni to'ldirish shart" },
      { status: 400 }
    );
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Parol kamida ${MIN_PASSWORD_LENGTH} ta belgidan iborat bo'lishi kerak` },
      { status: 400 }
    );
  }

  const { status, body: data } = await proxyJson('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
    headers: forwardedFor(request),
  });

  return NextResponse.json(data, { status });
}

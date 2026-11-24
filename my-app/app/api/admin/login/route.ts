import { NextResponse } from 'next/server';
import { findUserByEmail } from '../../../../lib/usersDb';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = (body.username || body.email || body.login || '').trim();
    const password = (body.password || '').trim();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Admin login va parol kiritilishi shart' },
        { status: 400 }
      );
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hackaton-xl22.onrender.com';

    // 1. First attempt to authenticate via FastAPI backend
    try {
      const backendRes = await fetch(`${backendUrl}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (backendRes.ok) {
        const backendData = await backendRes.json();
        return NextResponse.json(backendData);
      }
    } catch (e) {
      console.warn('Backend /api/admin/login ga ulanishda ogohlantirish, lokal bazaga o\'tilmoqda:', e);
    }

    // 2. Fallback to local users storage
    const user = findUserByEmail(username);

    if (!user) {
      return NextResponse.json(
        { error: 'Admin foydalanuvchisi topilmadi.' },
        { status: 404 }
      );
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Kirish taqiqlangan: Siz administrator emassiz!' },
        { status: 403 }
      );
    }

    if (user.password !== password) {
      return NextResponse.json(
        { error: 'Kiritilgan admin paroli noto\'g\'ri' },
        { status: 401 }
      );
    }

    const session = {
      id: user.id,
      name: user.name,
      email: user.email,
      username: 'admin',
      role: 'admin',
      avatar: user.avatar,
      token: `voxy_admin_jwt_${user.id}_${Date.now()}`,
    };

    return NextResponse.json({
      success: true,
      user: session,
      token: session.token,
      message: 'Administrator sifatida muvaffaqiyatli kirildi',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Server xatoligi yuz berdi' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { findUserByEmail } from '../../../../lib/usersDb';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email va parol kiritilishi shart' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hackaton-xl22.onrender.com';

    // 1. First attempt to authenticate against live Render backend (MongoDB)
    try {
      const backendRes = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });

      if (backendRes.ok) {
        const backendData = await backendRes.json();
        return NextResponse.json(backendData);
      }
    } catch (e) {
      console.warn('Render backend login failed, falling back to local users database:', e);
    }

    // 2. Fallback to local user database
    const user = findUserByEmail(normalizedEmail);
    if (!user) {
      return NextResponse.json(
        { error: 'Bunday email bilan foydalanuvchi topilmadi. Iltimos, ro\'yxatdan o\'ting.' },
        { status: 404 }
      );
    }

    if (user.password !== password) {
      return NextResponse.json(
        { error: 'Kiritilgan parol noto\'g\'ri' },
        { status: 401 }
      );
    }

    const session = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      selectedSubject: user.selectedSubject,
      avatar: user.avatar,
      token: `voxy_jwt_${user.id}_${Date.now()}`,
    };

    return NextResponse.json({
      success: true,
      user: session,
      message: 'Muvaffaqiyatli tizimga kirildi',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Server xatoligi yuz berdi' },
      { status: 500 }
    );
  }
}

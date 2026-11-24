import { NextResponse } from 'next/server';
import { findUserByEmail, saveUser, UserRecord } from '../../../../lib/usersDb';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Barcha maydonlarni to\'ldirish shart' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hackaton-xl22.onrender.com';

    // 1. First attempt to register user directly in live Render backend (MongoDB Atlas)
    try {
      const backendRes = await fetch(`${backendUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: normalizedEmail, password }),
      });

      if (backendRes.ok) {
        const backendData = await backendRes.json();
        return NextResponse.json(backendData);
      }
    } catch (e) {
      console.warn('Render backend register failed, falling back to local storage:', e);
    }

    // 2. Fallback to local storage
    const existing = findUserByEmail(normalizedEmail);
    if (existing) {
      return NextResponse.json(
        { error: 'Ushbu email manzili allaqachon ro\'yxatdan o\'tgan. Iltimos, tizimga kiring.' },
        { status: 409 }
      );
    }

    const newUser: UserRecord = {
      id: `u_${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      password: password,
      role: normalizedEmail.includes('admin') ? 'admin' : 'student',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString(),
    };

    const saved = saveUser(newUser);
    if (!saved) {
      return NextResponse.json(
        { error: 'Foydalanuvchini saqlashda xatolik yuz berdi' },
        { status: 500 }
      );
    }

    const session = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      avatar: newUser.avatar,
      token: `voxy_jwt_${newUser.id}_${Date.now()}`,
    };

    return NextResponse.json({
      success: true,
      user: session,
      message: 'Muvaffaqiyatli ro\'yxatdan o\'tdingiz',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Serverda kutilmagan xatolik yuz berdi' },
      { status: 500 }
    );
  }
}

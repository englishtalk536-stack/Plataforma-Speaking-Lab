import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '../../../../lib/prisma';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: string; email?: string; password?: string };
    const name = body.name?.trim();
    const email = body.email?.toLowerCase().trim();
    const password = body.password ?? '';

    if (!name || !email || password.length < 8) {
      return NextResponse.json({ error: 'Name, email, and a password of at least 8 characters are required.' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });

    const user = await prisma.user.create({
      data: { fullName: name, email, passwordHash: await bcrypt.hash(password, 12) },
    });
    return NextResponse.json({ id: user.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Unable to create your account.' }, { status: 500 });
  }
}

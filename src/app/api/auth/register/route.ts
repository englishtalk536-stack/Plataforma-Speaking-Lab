import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'La creación de cuentas requiere una invitación válida.' },
    { status: 410 },
  );
}

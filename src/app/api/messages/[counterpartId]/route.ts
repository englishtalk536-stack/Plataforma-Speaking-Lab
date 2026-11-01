import { NextResponse, type NextRequest } from 'next/server';
import { getAuthorizedChatPair, getChatIdentity } from '../../../../lib/chat-access';
import { prisma } from '../../../../lib/prisma';

type RouteContext = { params: Promise<{ counterpartId: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const identity = await getChatIdentity();
  if (!identity) return NextResponse.json({ error: 'Debes iniciar sesión para ver tus mensajes.' }, { status: 401 });
  const { counterpartId } = await params;
  const pair = await getAuthorizedChatPair(identity, counterpartId);
  if (!pair) return NextResponse.json({ error: 'No tienes permiso para conversar con esta persona.' }, { status: 403 });

  const conversation = await prisma.teacherStudentConversation.findUnique({
    where: { teacherId_studentId: { teacherId: pair.teacherId, studentId: pair.studentId } },
    select: { id: true },
  });
  if (!conversation) return NextResponse.json({ contact: pair.counterpart, messages: [] });

  await prisma.teacherStudentMessage.updateMany({
    where: { conversationId: conversation.id, senderId: { not: identity.id }, readAt: null },
    data: { readAt: new Date() },
  });
  const messages = await prisma.teacherStudentMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: { id: true, senderId: true, content: true, createdAt: true, readAt: true },
  });

  return NextResponse.json({ contact: pair.counterpart, messages: messages.reverse() });
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const identity = await getChatIdentity();
  if (!identity) return NextResponse.json({ error: 'Debes iniciar sesión para enviar mensajes.' }, { status: 401 });
  const { counterpartId } = await params;
  const pair = await getAuthorizedChatPair(identity, counterpartId);
  if (!pair) return NextResponse.json({ error: 'No tienes permiso para conversar con esta persona.' }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'El mensaje no tiene un formato válido.' }, { status: 400 });
  }
  const content = body && typeof body === 'object' && 'content' in body && typeof body.content === 'string'
    ? body.content.trim()
    : '';
  if (!content || content.length > 2000) {
    return NextResponse.json({ error: 'Escribe un mensaje de hasta 2000 caracteres.' }, { status: 400 });
  }

  const conversation = await prisma.teacherStudentConversation.upsert({
    where: { teacherId_studentId: { teacherId: pair.teacherId, studentId: pair.studentId } },
    create: { teacherId: pair.teacherId, studentId: pair.studentId },
    update: { updatedAt: new Date() },
    select: { id: true },
  });
  const message = await prisma.teacherStudentMessage.create({
    data: { conversationId: conversation.id, senderId: identity.id, content },
    select: { id: true, senderId: true, content: true, createdAt: true, readAt: true },
  });
  await prisma.teacherStudentConversation.update({ where: { id: conversation.id }, data: { updatedAt: message.createdAt } });

  return NextResponse.json({ message }, { status: 201 });
}

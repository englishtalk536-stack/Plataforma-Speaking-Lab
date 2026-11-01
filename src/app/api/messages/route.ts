import { NextResponse } from 'next/server';
import { getChatIdentity } from '../../../lib/chat-access';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  const identity = await getChatIdentity();
  if (!identity) return NextResponse.json({ error: 'Debes iniciar sesión para ver tus mensajes.' }, { status: 401 });

  const memberships = await prisma.classroomMembership.findMany({
    where: identity.role === 'TEACHER'
      ? {
          status: 'ACTIVE',
          classroom: { is: { teacherId: identity.id, status: 'ACTIVE' } },
          user: { is: { role: 'STUDENT', accessStatus: 'ACTIVE' } },
        }
      : {
          userId: identity.id,
          status: 'ACTIVE',
          classroom: {
            is: {
              status: 'ACTIVE',
              teacher: { is: { role: 'TEACHER', accessStatus: 'ACTIVE' } },
            },
          },
        },
    select: {
      classroom: {
        select: {
          id: true,
          name: true,
          teacher: { select: { id: true, fullName: true, accessStatus: true } },
        },
      },
      user: { select: { id: true, fullName: true, accessStatus: true } },
    },
  });

  const contacts = new Map<string, { id: string; fullName: string; classrooms: { id: string; name: string }[] }>();
  for (const membership of memberships) {
    const person = identity.role === 'TEACHER' ? membership.user : membership.classroom.teacher;
    if (person.accessStatus !== 'ACTIVE') continue;
    const contact = contacts.get(person.id) ?? { id: person.id, fullName: person.fullName, classrooms: [] };
    if (!contact.classrooms.some(({ id }) => id === membership.classroom.id)) {
      contact.classrooms.push({ id: membership.classroom.id, name: membership.classroom.name });
    }
    contacts.set(person.id, contact);
  }

  const contactIds = [...contacts.keys()];
  if (contactIds.length === 0) return NextResponse.json({ contacts: [] });

  const conversations = await prisma.teacherStudentConversation.findMany({
    where: identity.role === 'TEACHER'
      ? { teacherId: identity.id, studentId: { in: contactIds } }
      : { studentId: identity.id, teacherId: { in: contactIds } },
    select: {
      id: true,
      teacherId: true,
      studentId: true,
      updatedAt: true,
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { content: true, senderId: true, createdAt: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });
  const conversationIds = conversations.map(({ id }) => id);
  const unreadMessages = conversationIds.length === 0
    ? []
    : await prisma.teacherStudentMessage.findMany({
        where: { conversationId: { in: conversationIds }, senderId: { not: identity.id }, readAt: null },
        select: { conversationId: true },
      });
  const unreadCounts = new Map<string, number>();
  for (const message of unreadMessages) unreadCounts.set(message.conversationId, (unreadCounts.get(message.conversationId) ?? 0) + 1);
  const conversationByContact = new Map(conversations.map((conversation) => [
    identity.role === 'TEACHER' ? conversation.studentId : conversation.teacherId,
    { ...conversation, unreadCount: unreadCounts.get(conversation.id) ?? 0 },
  ]));

  const result = [...contacts.values()].map((contact) => {
    const conversation = conversationByContact.get(contact.id);
    return {
      ...contact,
      classrooms: contact.classrooms.sort((first, second) => first.name.localeCompare(second.name, 'es')),
      conversationId: conversation?.id ?? null,
      unreadCount: conversation?.unreadCount ?? 0,
      lastMessage: conversation?.messages[0] ?? null,
      updatedAt: conversation?.updatedAt ?? null,
    };
  }).sort((first, second) => {
    if (first.updatedAt && second.updatedAt) return second.updatedAt.getTime() - first.updatedAt.getTime();
    if (first.updatedAt) return -1;
    if (second.updatedAt) return 1;
    return first.fullName.localeCompare(second.fullName, 'es');
  });

  return NextResponse.json({ contacts: result });
}

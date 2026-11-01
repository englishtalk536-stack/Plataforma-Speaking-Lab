import { StudentSidebarNav } from '../../../components/StudentSidebarNav';
import { TeacherStudentChat } from '../../../components/TeacherStudentChat';
import { requireStudentId } from '../../../lib/student-auth';

export default async function StudentMessagesPage({ searchParams }: { searchParams: Promise<{ contact?: string }> }) {
  await requireStudentId();
  const { contact } = await searchParams;
  return (
    <div className="min-h-screen bg-speaking-background md:flex">
      <StudentSidebarNav active="messages" />
      <TeacherStudentChat role="STUDENT" initialContactId={contact} />
    </div>
  );
}

import { TeacherSidebarNav } from '../../../components/TeacherSidebarNav';
import { TeacherStudentChat } from '../../../components/TeacherStudentChat';
import { requireTeacherId } from '../../../lib/teacher-auth';

export default async function TeacherMessagesPage({ searchParams }: { searchParams: Promise<{ contact?: string }> }) {
  await requireTeacherId();
  const { contact } = await searchParams;
  return (
    <div className="flex min-h-screen flex-col bg-speaking-background md:flex-row">
      <TeacherSidebarNav active="messages" />
      <TeacherStudentChat role="TEACHER" initialContactId={contact} />
    </div>
  );
}

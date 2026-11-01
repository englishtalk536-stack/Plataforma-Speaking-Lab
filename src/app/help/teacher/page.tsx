import { requireTeacherId } from '../../../lib/teacher-auth';
import { HelpGuide } from '../../../components/HelpGuide';
import { TeacherSidebarNav } from '../../../components/TeacherSidebarNav';

export default async function TeacherHelpPage() {
  await requireTeacherId();
  return <div className="flex min-h-screen flex-col bg-speaking-background md:flex-row"><TeacherSidebarNav active="help" /><HelpGuide audience="teacher" /></div>;
}

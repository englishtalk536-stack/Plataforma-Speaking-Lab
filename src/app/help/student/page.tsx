import { requireStudentId } from '../../../lib/student-auth';
import { HelpGuide } from '../../../components/HelpGuide';
import { StudentSidebarNav } from '../../../components/StudentSidebarNav';

export default async function StudentHelpPage() {
  await requireStudentId();
  return <div className="min-h-screen bg-speaking-background md:flex"><StudentSidebarNav active="help" /><HelpGuide audience="student" /></div>;
}

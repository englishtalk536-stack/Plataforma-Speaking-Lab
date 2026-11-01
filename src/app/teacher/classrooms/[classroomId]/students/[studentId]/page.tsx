import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '../../../../../../lib/prisma';
import { requireTeacherId } from '../../../../../../lib/teacher-auth';
import { CalendarDays, History } from 'lucide-react';
import { AssignDailyQuestForm, AssignPracticeForm, CreateTeacherMissionForm } from './AssignPracticeForm';
import { StatusBadge } from '../../../../../../components/ui/StatusBadge';
import { EmptyState } from '../../../../../../components/ui/EmptyState';
import { DashboardSection } from '../../../../../../components/dashboard/DashboardSection';
import { PageHeader } from '../../../../../../components/dashboard/PageHeader';
import { StudentEnglishLevelForm } from './StudentEnglishLevelForm';
import { todayUtcMidnight } from '../../../../../../server/errors';

export default async function TeacherStudentProgressPage({
  params,
}: {
  params: Promise<{ classroomId: string; studentId: string }>;
}) {
  const teacherId = await requireTeacherId();
  const { classroomId, studentId } = await params;
  const membership = await prisma.classroomMembership.findFirst({
    where: {
      classroomId,
      userId: studentId,
      classroom: { is: { teacherId, status: 'ACTIVE' } },
      user: { is: { role: 'STUDENT' } },
    },
    select: {
      id: true,
      status: true,
      englishLevel: true,
      englishLevelChanges: {
        select: {
          id: true,
          previousLevel: true,
          newLevel: true,
          changedAt: true,
          reason: true,
          changedByTeacher: { select: { fullName: true } },
        },
        orderBy: { changedAt: 'desc' },
        take: 5,
      },
      user: { select: { id: true, fullName: true, accessStatus: true } },
      classroom: { select: { id: true, name: true } },
    },
  });

  if (!membership) notFound();

  const [assignedProgress, lessonProgress, skillNodes, dailyQuests, assignedDailyQuests] = await Promise.all([
    prisma.userSkillProgress.findMany({
      where: { userId: studentId, status: { in: ['UNLOCKED', 'COMPLETED'] } },
      select: {
        id: true,
        status: true,
        completedAt: true,
        node: { select: { id: true, title: true, description: true, xpReward: true } },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.userLessonProgress.findMany({
      where: { userId: studentId },
      select: { nodeId: true, attempts: true, score: true, completedAt: true },
    }),
    prisma.skillNode.findMany({
      select: { id: true, title: true, cefrLevel: true },
      orderBy: { levelRequired: 'asc' },
    }),
    prisma.dailyQuest.findMany({
      where: { isActive: true },
      select: { id: true, title: true, description: true, xpReward: true, coinReward: true, activityType: true, resourceUrl: true },
      orderBy: { title: 'asc' },
    }),
    prisma.userDailyQuest.findMany({
      where: { userId: studentId, assignedDate: todayUtcMidnight() },
      select: { id: true, status: true, quest: { select: { title: true, description: true, xpReward: true, coinReward: true, activityType: true, resourceUrl: true } } },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const assignedNodeIds = new Set(assignedProgress.map((progress) => progress.node.id));
  const availableNodes = skillNodes.filter((node) => !assignedNodeIds.has(node.id));
  const pendingDailyQuests = assignedDailyQuests.filter((assignment) => assignment.status !== 'COMPLETED');
  const lessonProgressByNode = new Map(lessonProgress.map((progress) => [progress.nodeId, progress]));
  const pendingAssignedProgress = assignedProgress.filter((progress) => progress.status !== 'COMPLETED');
  const completedAssignedProgress = assignedProgress.filter((progress) => progress.status === 'COMPLETED');
  const completedPracticeIds = new Set(completedAssignedProgress.map((progress) => progress.node.id));

  function renderProgressItems(progressItems: typeof assignedProgress) {
    return progressItems.map((progress) => {
      const result = lessonProgressByNode.get(progress.node.id);
      const completed = progress.status === 'COMPLETED';

      return (
        <li key={progress.id} className="py-4 first:pt-0 last:pb-0">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
            <div>
              <h3 className="font-title text-lg text-speaking-cobalt">{progress.node.title}</h3>
              {progress.node.description && <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-speaking-cobalt/70">{progress.node.description}</p>}
            </div>
            <StatusBadge tone={completed ? 'success' : 'info'}>{completed ? 'Completada' : 'Pendiente'}</StatusBadge>
          </div>
          {result && (
            <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-body text-sm text-speaking-cobalt/70">
              <div className="flex gap-1.5"><dt>Intentos:</dt><dd>{result.attempts}</dd></div>
              {result.score != null && <div className="flex gap-1.5"><dt>Resultado:</dt><dd>{Math.round(result.score)}%</dd></div>}
              {result.completedAt && <div className="flex gap-1.5"><dt>Última finalización:</dt><dd><time dateTime={result.completedAt.toISOString()}>{result.completedAt.toLocaleDateString('es')}</time></dd></div>}
            </dl>
          )}
        </li>
      );
    });
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href={`/teacher/classrooms/${membership.classroom.id}`}
        className="inline-flex min-h-11 items-center text-sm text-speaking-cobalt underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-cobalt focus-visible:outline-offset-2"
      >
        Volver al aula {membership.classroom.name}
      </Link>

      <PageHeader eyebrow={`Progreso del estudiante · ${membership.classroom.name}`} title={membership.user.fullName} />
      <div>
        {(membership.status === 'INACTIVE' || membership.user.accessStatus === 'PAUSED') && (
          <p className="mt-3 font-body text-sm text-speaking-streak">
            {membership.user.accessStatus === 'PAUSED'
              ? 'Cuenta pausada. El estudiante no puede acceder al dashboard, la práctica ni sus aulas.'
              : 'Membresía de esta aula inactiva. El estudiante no puede abrir sus actividades ni enviar respuestas.'}
          </p>
        )}
      </div>

      <div id="english-level" className="scroll-mt-6">
        <DashboardSection title="Nivel de inglés" description="Nivel asignado a este estudiante en esta aula.">
          <StudentEnglishLevelForm
            classroomId={classroomId}
            studentId={studentId}
            studentName={membership.user.fullName}
            currentLevel={membership.englishLevel}
          />
          {membership.englishLevelChanges.length > 0 && (
            <div className="mt-5 border-t border-speaking-cobalt/10 pt-4">
              <h3 className="font-body text-sm font-semibold text-speaking-cobalt">Cambios recientes</h3>
              <ol className="mt-2 divide-y divide-speaking-cobalt/10">
                {membership.englishLevelChanges.map((change) => (
                  <li key={change.id} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-body text-sm text-speaking-cobalt">
                        {change.previousLevel ?? 'Sin nivel asignado'} → {change.newLevel}
                      </p>
                      <p className="mt-1 font-body text-xs text-speaking-cobalt/65">Por {change.changedByTeacher.fullName}</p>
                      {change.reason && <p className="mt-1 whitespace-pre-wrap break-words font-body text-sm text-speaking-cobalt/75">{change.reason}</p>}
                    </div>
                    <time dateTime={change.changedAt.toISOString()} className="font-body text-xs text-speaking-cobalt/60">
                      {change.changedAt.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
                    </time>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </DashboardSection>
      </div>

      <section aria-labelledby="daily-missions-heading" className="overflow-hidden rounded-2xl border border-speaking-cobalt/10 bg-gradient-to-br from-white via-white to-speaking-background shadow-[0_14px_38px_rgba(16,52,105,0.09)]">
        <header className="flex flex-col gap-4 bg-gradient-to-r from-speaking-cobalt to-speaking-king px-5 py-5 text-white sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-6">
          <div className="flex items-start gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-speaking-mustard/35 bg-white/10 text-speaking-mustard"><CalendarDays className="h-5 w-5" aria-hidden="true" /></span>
            <div>
              <p className="font-body text-xs font-bold uppercase tracking-[0.12em] text-speaking-mustard">Plan del estudiante</p>
              <h2 id="daily-missions-heading" className="mt-1 font-title text-2xl text-white">Misiones del día</h2>
              <p className="mt-1 font-body text-sm leading-6 text-white/85">Seguimiento y asignación para {membership.user.fullName} · {membership.classroom.name}</p>
            </div>
          </div>
          <Link href={`/teacher/history?classroomId=${classroomId}&studentId=${studentId}#daily-mission-history`} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-speaking-mustard/45 bg-speaking-mustard px-4 font-body text-sm font-bold text-speaking-cobalt shadow-sm transition-colors hover:bg-speaking-mustard/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 sm:self-auto">
            <History className="h-4 w-4" aria-hidden="true" />Ver historial
          </Link>
        </header>

        <div className="space-y-5 p-4 sm:p-6">
          {pendingDailyQuests.length > 0 ? (
            <ul className="divide-y divide-speaking-cobalt/10 overflow-hidden rounded-xl border border-speaking-cobalt/10 bg-white px-4 sm:px-5">
              {pendingDailyQuests.map((assignment) => (
                <li key={assignment.id} className="flex flex-col gap-3 py-4 first:pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 border-l-2 border-speaking-mustard pl-3">
                    <p className="font-body text-base font-bold text-speaking-cobalt">{assignment.quest.title}</p>
                    <p className="mt-1 font-body text-sm font-semibold text-speaking-king">{assignment.quest.activityType} · {assignment.quest.xpReward} XP · {assignment.quest.coinReward} monedas</p>
                    <p className="mt-1 font-body text-sm leading-6 text-speaking-cobalt/75">{assignment.quest.description}</p>
                    {assignment.quest.resourceUrl && <a href={assignment.quest.resourceUrl} target={assignment.quest.resourceUrl.startsWith('http') ? '_blank' : undefined} rel={assignment.quest.resourceUrl.startsWith('http') ? 'noopener noreferrer' : undefined} className="mt-1 inline-flex min-h-9 items-center font-body text-sm font-semibold text-speaking-king underline-offset-4 hover:underline">Abrir recurso o práctica</a>}
                  </div>
                  <StatusBadge tone="warning">Pendiente</StatusBadge>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-xl border border-speaking-success/20 bg-speaking-success/5 px-4 py-4 font-body text-sm leading-6 text-speaking-cobalt">
              {assignedDailyQuests.length > 0 ? 'Todas las misiones de hoy están completadas. Ya puedes consultarlas en el historial.' : 'No hay misiones pendientes para hoy.'}
            </div>
          )}

          {membership.status === 'ACTIVE' && membership.user.accessStatus === 'ACTIVE' ? (
            <AssignDailyQuestForm classroomId={classroomId} studentId={studentId} quests={dailyQuests} />
          ) : (
            <p className="font-body text-sm leading-6 text-speaking-cobalt/75">Reactiva la cuenta y la matrícula del estudiante para asignar una misión.</p>
          )}
          {membership.status === 'ACTIVE' && membership.user.accessStatus === 'ACTIVE' && (
            <CreateTeacherMissionForm
              classroomId={classroomId}
              studentId={studentId}
              studentName={membership.user.fullName}
              classroomName={membership.classroom.name}
              practices={skillNodes.filter((node) => !completedPracticeIds.has(node.id)).map(({ id, title, cefrLevel }) => ({ id, title, cefrLevel }))}
            />
          )}
        </div>
      </section>

      <DashboardSection title="Prácticas pendientes" description="Prácticas de escucha y habla disponibles para el estudiante.">
        {pendingAssignedProgress.length === 0 ? (
          <EmptyState title="No hay prácticas pendientes" description="Las prácticas asignadas aparecerán aquí." />
        ) : (
          <ul className="divide-y divide-speaking-cobalt/10">
            {renderProgressItems(pendingAssignedProgress)}
          </ul>
        )}
      </DashboardSection>

      {completedAssignedProgress.length > 0 && (
        <DashboardSection title="Progreso completado" description="Prácticas y resultados ya registrados.">
          <ul className="divide-y divide-speaking-cobalt/10">{renderProgressItems(completedAssignedProgress)}</ul>
        </DashboardSection>
      )}

      <DashboardSection title="Asignar práctica">
        {membership.status === 'ACTIVE' && membership.user.accessStatus === 'ACTIVE' ? (
          <AssignPracticeForm
            classroomId={membership.classroom.id}
            studentId={membership.user.id}
            availableNodes={availableNodes}
          />
        ) : (
          <p className="mt-3 font-body text-sm text-speaking-cobalt/65">
            {membership.user.accessStatus === 'PAUSED'
              ? 'Reactiva la cuenta del estudiante para asignar nuevas prácticas.'
              : 'Reactiva la membresía para asignar nuevas prácticas.'}
          </p>
        )}
      </DashboardSection>

    </main>
  );
}

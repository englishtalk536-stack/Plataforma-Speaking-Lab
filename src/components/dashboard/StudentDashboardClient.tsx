'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StudentHeader } from './StudentHeader';
import { SkillPath } from './SkillPath';
import { FeedbackRadar } from './FeedbackRadar';
import { DailyQuestCard } from './DailyQuestCard';
import { DailyQuestActivityDialog } from './DailyQuestActivityDialog';
import { LessonModal } from './LessonModal';
import { DashboardSkeleton } from './DashboardSkeleton';
import { DashboardError } from './DashboardError';
import { ClassroomSummaryCard } from './ClassroomSummaryCard';
import { UpcomingVirtualClasses } from './UpcomingVirtualClasses';
import { NotificationList } from '../NotificationList';
import { StudentSidebarNav } from '../StudentSidebarNav';
import { DashboardSection } from './DashboardSection';
import { EmptyState } from '../ui/EmptyState';
import { StatusBadge } from '../ui/StatusBadge';
import { PageHeader } from './PageHeader';
import { completeQuest, useDashboardData } from '../../lib/hooks/useDashboardData';
import { getXpRequiredForLevel } from '../../lib/gamification/xp-formula';
import type { DailyQuestDto, SkillPathNodeDto, StudentDashboardResponse } from '../../lib/types/dashboard';
import { displayableText } from '../../lib/presentation-content';
import { Flame, GraduationCap, MessagesSquare, Sparkles } from 'lucide-react';

export function StudentDashboardClient() {
  const router = useRouter();
  const { dashboard, error, isLoading, mutate } = useDashboardData();

  const [selectedNode, setSelectedNode] = useState<SkillPathNodeDto | null>(null);
  const [selectedQuest, setSelectedQuest] = useState<DailyQuestDto | null>(null);
  const [submittingQuestId, setSubmittingQuestId] = useState<string | null>(null);
  const [rewardTrigger, setRewardTrigger] = useState(0);
  const [questError, setQuestError] = useState<string | null>(null);

  if (isLoading && !dashboard) {
    return <DashboardSkeleton />;
  }

  if (error && !dashboard) {
    return <DashboardError message={error instanceof Error ? error.message : 'Unknown error.'} onRetry={() => mutate()} />;
  }

  if (!dashboard) {
    return <DashboardSkeleton />;
  }

  const { profile, skillPath, feedbackRadar, dailyQuests, classrooms, upcomingVirtualClasses, notifications, classFollowUps, homeworkTasks, activities } = dashboard;
  const xpForCurrentLevel = getXpRequiredForLevel(profile.currentLevel);
  const activeClassFollowUps = classFollowUps.flatMap((followUp) => {
    const notes = displayableText(followUp.notes);
    const improvementOpportunities = displayableText(followUp.improvementOpportunities);
    const homeworkText = displayableText(followUp.homework);
    const homework = homeworkText?.toLowerCase() === 'nq' ? null : homeworkText;
    const practiceTitle = displayableText(followUp.practiceTitle);
    const pendingPracticeTitle = followUp.practiceCompleted ? null : practiceTitle;

    if (!notes && !improvementOpportunities && !homework && !pendingPracticeTitle) return [];

    return [{ followUp, notes, improvementOpportunities, homework, practiceTitle: pendingPracticeTitle }];
  });
  const activeDailyQuests = dailyQuests.filter((quest) => quest.status === 'PENDING');
  const activeHomeworkTasks = homeworkTasks.filter((task) => {
    if (!displayableText(task.homework)) return false;
    const e2eTitle = /^E2E Clase (\d+)$/.exec(task.title.trim());
    return !e2eTitle || task.homework.trim() !== `E2E Tarea ${e2eTitle[1]}`;
  });
  const visibleNotifications = notifications.filter((notification) =>
    !(notification.title === 'Seguimiento de clase actualizado' && /E2E Clase \d+/.test(notification.message)),
  );
  const assignedEnglishLevels = classrooms.flatMap((classroom) =>
    classroom.englishLevel ? [{ classroomName: classroom.name, level: classroom.englishLevel }] : [],
  );
  const englishLevelSummary = assignedEnglishLevels.length === 0
    ? 'Nivel de inglés aún sin asignar'
    : assignedEnglishLevels.length === 1
      ? `Nivel de inglés asignado: ${assignedEnglishLevels[0].level}`
      : `Niveles de inglés: ${assignedEnglishLevels.map(({ classroomName, level }) => `${classroomName} (${level})`).join(', ')}`;

  async function handleCompleteQuest(questId: string): Promise<boolean> {
    setQuestError(null);
    setSubmittingQuestId(questId);
    try {
      const result = await completeQuest(questId);
      setRewardTrigger((n) => n + 1);

      await mutate(
        (current): StudentDashboardResponse | undefined =>
          current && {
            ...current,
            profile: {
              ...current.profile,
              currentLevel: result.currentLevel,
              currentXP: result.newTotalXp,
              nextLevelXP: getXpRequiredForLevel(result.currentLevel + 1),
              streakDays: result.currentStreak,
              speakingCoins: result.newTotalCoins,
            },
            dailyQuests: current.dailyQuests.map((quest) =>
              quest.id === questId ? { ...quest, status: 'COMPLETED' as const } : quest,
            ),
          },
        { revalidate: false },
      );
      return true;
    } catch (err) {
      setQuestError(err instanceof Error ? err.message : 'Could not complete the quest. Please try again.');
      return false;
    } finally {
      setSubmittingQuestId(null);
    }
  }

  function handleStartLesson(node: SkillPathNodeDto) {
    router.push(`/practice/${node.id}`);
  }

  const hasActiveContent = upcomingVirtualClasses.length > 0 || activities.length > 0 || activeHomeworkTasks.length > 0 ||
    activeClassFollowUps.length > 0 || activeDailyQuests.length > 0 || skillPath.length > 0;

  return (
    <div className="min-h-screen bg-[#f4f7fb] md:flex">
      <StudentSidebarNav active="dashboard" />
      <main id="student-dashboard" className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-8 lg:px-10">
        <div className="mx-auto w-full max-w-6xl space-y-7 lg:space-y-8">
          <StudentHeader
            fullName={profile.name}
            avatarUrl={profile.avatarUrl}
            level={profile.currentLevel}
            currentXp={profile.currentXP}
            xpForCurrentLevel={xpForCurrentLevel}
            xpForNextLevel={profile.nextLevelXP}
            currentStreak={profile.streakDays}
            coins={profile.speakingCoins}
            rewardTrigger={rewardTrigger}
          />

          <PageHeader
            eyebrow="Resumen del día"
            title={`Bienvenido, ${profile.name}`}
            description={`${englishLevelSummary} · Nivel de progreso ${profile.currentLevel} · ${profile.currentXP} XP · ${profile.nextLevelXP} XP para el siguiente nivel`}
            action={
              <Link
                href="/student/history"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-speaking-cobalt px-4 py-2 font-body text-sm font-semibold text-white hover:bg-speaking-cobalt/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-mustard focus-visible:outline-offset-2"
              >
                Ver historial
              </Link>
            }
          />

          <section aria-label="Métricas del estudiante">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="group relative overflow-hidden rounded-2xl border border-speaking-cobalt/10 bg-white p-4 shadow-[0_4px_18px_rgba(16,52,105,0.045)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(16,52,105,0.09)] sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="font-body text-xs font-semibold uppercase tracking-[0.08em] text-speaking-cobalt/60">Aulas</p><p className="mt-3 font-title text-3xl leading-none text-speaking-cobalt">{classrooms.length}</p></div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-speaking-king/10 text-speaking-king"><GraduationCap className="h-5 w-5" aria-hidden="true" /></span>
                </div>
                <p className="mt-3 font-body text-xs text-speaking-cobalt/70">Espacios de aprendizaje activos</p>
              </div>
              <div className="group relative overflow-hidden rounded-2xl border border-speaking-cobalt/10 bg-white p-4 shadow-[0_4px_18px_rgba(16,52,105,0.045)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(16,52,105,0.09)] sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="font-body text-xs font-semibold uppercase tracking-[0.08em] text-speaking-cobalt/60">Seguimientos</p><p className="mt-3 font-title text-3xl leading-none text-speaking-cobalt">{activeClassFollowUps.length}</p></div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-speaking-king/10 text-speaking-king"><MessagesSquare className="h-5 w-5" aria-hidden="true" /></span>
                </div>
                <p className="mt-3 font-body text-xs text-speaking-cobalt/70">Notas para avanzar en clase</p>
              </div>
              <div className="group relative overflow-hidden rounded-2xl border border-speaking-cobalt/10 bg-white p-4 shadow-[0_4px_18px_rgba(16,52,105,0.045)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(16,52,105,0.09)] sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="font-body text-xs font-semibold uppercase tracking-[0.08em] text-speaking-cobalt/60">Misiones</p><p className="mt-3 font-title text-3xl leading-none text-speaking-cobalt">{activeDailyQuests.length}</p></div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-speaking-mustard/20 text-speaking-cobalt"><Sparkles className="h-5 w-5" aria-hidden="true" /></span>
                </div>
                <p className="mt-3 font-body text-xs text-speaking-cobalt/70">Retos disponibles hoy</p>
              </div>
              <div className="group relative overflow-hidden rounded-2xl border border-speaking-cobalt/10 bg-white p-4 shadow-[0_4px_18px_rgba(16,52,105,0.045)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(16,52,105,0.09)] sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="font-body text-xs font-semibold uppercase tracking-[0.08em] text-speaking-cobalt/75">Racha</p><p className="mt-3 font-title text-3xl leading-none text-speaking-cobalt">{profile.streakDays}<span className="ml-1 font-body text-base font-semibold text-speaking-cobalt/70">días</span></p></div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-speaking-streak/10 text-speaking-streak"><Flame className="h-5 w-5" aria-hidden="true" /></span>
                </div>
                <p className="mt-3 font-body text-xs text-speaking-cobalt/70">Tu constancia en Speaking Lab</p>
              </div>
            </div>
          </section>

          <NotificationList notifications={visibleNotifications} />

          {!hasActiveContent && (
            <EmptyState
              title="No tienes actividades pendientes."
              description="Cuando tengas una clase, tarea o práctica por completar, aparecerá aquí."
              action={
                <Link href="/student/history" className="inline-flex min-h-11 items-center font-body text-sm font-semibold text-speaking-cobalt underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-cobalt focus-visible:outline-offset-2">
                  Ver historial
                </Link>
              }
            />
          )}

          {activities.length > 0 && (
            <DashboardSection title="Actividades pendientes" description="Actividades escritas que esperan tu entrega.">
              <ul className="grid gap-3 xl:grid-cols-2">
                {activities.map((activity) => (
                  <li key={activity.id} className="flex h-full flex-col border border-speaking-cobalt/12 border-l-4 border-l-speaking-king/70 bg-white p-4 sm:p-5">
                    <div className="flex flex-1 flex-col gap-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-body text-xs font-bold uppercase tracking-[0.08em] text-speaking-king">Actividad escrita</p>
                          <h3 className="mt-1 font-title text-lg text-speaking-cobalt">{displayableText(activity.title) ?? 'Actividad'}</h3>
                        </div>
                        <StatusBadge tone="warning">Pendiente de entregar</StatusBadge>
                      </div>
                      {displayableText(activity.classroomName) && <p className="font-body text-xs font-medium text-speaking-cobalt/60">{displayableText(activity.classroomName)}</p>}
                      {displayableText(activity.prompt) && <p className="border-l-2 border-speaking-cobalt/15 bg-speaking-white px-3 py-2 whitespace-pre-wrap break-words font-body text-sm leading-6 text-speaking-cobalt/80">{displayableText(activity.prompt)}</p>}
                    </div>
                    <Link href={`/student/classrooms/${activity.classroomId}#student-pending-tasks`} className="mt-4 inline-flex min-h-11 w-full items-center justify-center bg-speaking-cobalt px-4 font-body text-sm font-semibold text-white transition-colors hover:bg-speaking-king focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-cobalt focus-visible:outline-offset-2 sm:w-auto sm:self-start">
                      Abrir actividad
                    </Link>
                  </li>
                ))}
              </ul>
            </DashboardSection>
          )}

          {activeHomeworkTasks.length > 0 && (
            <DashboardSection title="Tareas pendientes" description="Tareas de texto compartidas por tu profesor.">
              <ul className="divide-y divide-speaking-cobalt/10">
                {activeHomeworkTasks.map((task) => (
                  <li key={task.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {displayableText(task.title) && <h3 className="font-body text-sm font-semibold text-speaking-cobalt">{displayableText(task.title)}</h3>}
                        <StatusBadge tone="warning">Pendiente</StatusBadge>
                      </div>
                      {displayableText(task.classroomName) && <p className="mt-1 font-body text-xs text-speaking-cobalt/65">{displayableText(task.classroomName)}</p>}
                      <p className="mt-2 whitespace-pre-wrap break-words font-body text-sm leading-6 text-speaking-cobalt/80">{displayableText(task.homework)}</p>
                    </div>
                    <Link href={`/student/classrooms/${task.classroomId}#student-pending-tasks`} className="inline-flex min-h-11 shrink-0 items-center font-body text-sm font-semibold text-speaking-cobalt underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-cobalt focus-visible:outline-offset-2">
                      Abrir aula
                    </Link>
                  </li>
                ))}
              </ul>
            </DashboardSection>
          )}

          {activeClassFollowUps.length > 0 && (
            <DashboardSection title="Seguimiento de tus clases" description="Observa las recomendaciones y tareas que te dejó tu profesor.">
              <ul className="space-y-4">
                {activeClassFollowUps.map(({ followUp, notes, improvementOpportunities, homework, practiceTitle }) => (
                  <li key={followUp.id} className="overflow-hidden rounded-2xl border border-speaking-cobalt/10 bg-white shadow-[0_4px_18px_rgba(16,52,105,0.04)] transition duration-200 hover:shadow-[0_10px_26px_rgba(16,52,105,0.085)]">
                    <div className="flex flex-col justify-between gap-3 border-b border-speaking-cobalt/10 bg-speaking-white px-4 py-4 sm:flex-row sm:items-center sm:px-5">
                      <div className="min-w-0">
                        <p className="font-body text-xs font-bold uppercase tracking-[0.1em] text-speaking-king">Seguimiento de clase</p>
                        {displayableText(followUp.title) && <h3 className="mt-1 font-title text-lg text-speaking-cobalt">{displayableText(followUp.title)}</h3>}
                        {displayableText(followUp.classroomName) && <p className="mt-1 font-body text-xs font-medium text-speaking-cobalt/60">{displayableText(followUp.classroomName)}</p>}
                      </div>
                      <time dateTime={followUp.taughtAt} className="shrink-0 rounded-lg bg-white px-3 py-2 font-body text-xs font-semibold text-speaking-cobalt/65 ring-1 ring-speaking-cobalt/8">
                        {new Date(followUp.taughtAt).toLocaleDateString('es-ES', { dateStyle: 'medium' })}
                      </time>
                    </div>
                    <div className="p-4 sm:p-5">
                    {notes && <p className="whitespace-pre-wrap break-words border-l-2 border-speaking-king/35 pl-3 font-body text-sm leading-6 text-speaking-cobalt/80 sm:pl-4">{notes}</p>}

                    {improvementOpportunities && (
                      <div className="mt-4 border-t border-speaking-cobalt/10 pt-3">
                        <h4 className="font-body text-xs font-semibold uppercase tracking-[0.08em] text-speaking-cobalt/65">Oportunidades</h4>
                        <p className="mt-2 whitespace-pre-wrap break-words font-body text-sm leading-6 text-speaking-cobalt/75">{improvementOpportunities}</p>
                      </div>
                    )}

                    {homework && (
                      <div className="mt-4 border-t border-speaking-cobalt/10 pt-3">
                        <h4 className="font-body text-xs font-semibold uppercase tracking-[0.08em] text-speaking-cobalt/65">Tareas</h4>
                        <p className="mt-2 whitespace-pre-wrap break-words font-body text-sm leading-6 text-speaking-cobalt/75">{homework}</p>
                      </div>
                    )}

                    {practiceTitle && <p className="mt-4 font-body text-sm font-semibold text-speaking-cobalt">Práctica: {practiceTitle}</p>}

                    <Link
                      href={`/student/classrooms/${followUp.classroomId}#class-lesson-notes-heading`}
                      className="mt-5 inline-flex min-h-11 w-full items-center justify-center bg-speaking-cobalt px-4 font-body text-sm font-semibold text-white transition duration-200 hover:bg-speaking-king focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-cobalt focus-visible:outline-offset-2 sm:w-auto"
                    >Abrir aula</Link>
                    </div>
                  </li>
                ))}
              </ul>
            </DashboardSection>
          )}

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <DashboardSection title="Tus aulas" description="Accede a las clases en las que estás activo.">
              {classrooms.length === 0 ? (
                <EmptyState
                  title="No tienes aulas activas"
                  description="Aún no te han asignado una clase. Cuando ocurra, aparecerá aquí."
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {classrooms.map((classroom) => (
                    <ClassroomSummaryCard key={classroom.id} classroom={classroom} />
                  ))}
                </div>
              )}
            </DashboardSection>

            <DashboardSection title="Radar de feedback" description="Tu evolución en las principales competencias.">
              <FeedbackRadar className="mx-auto flex justify-center rounded-2xl bg-speaking-white/70" {...feedbackRadar} />
            </DashboardSection>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <DashboardSection title="Ruta de aprendizaje" description="Sigue las prácticas que tu profesor ha preparado para ti.">
              {skillPath.length === 0 ? (
                <EmptyState
                  title="Tu journey empieza pronto"
                  description="Cuando tu profesor te asigne prácticas, aparecerán aquí con cada paso de tu progreso."
                />
              ) : (
                <SkillPath
                  className="mt-2"
                  nodes={skillPath}
                  selectedNodeId={selectedNode?.id ?? null}
                  onSelectNode={setSelectedNode}
                />
              )}
            </DashboardSection>

            <DashboardSection title="Misiones del día" description="Completa estos retos para sumar XP y monedas. Al terminarlos, los verás en tu historial.">
              {activeDailyQuests.length === 0 ? (
                <EmptyState
                  title="Sin misiones hoy"
                  description="No hay tareas pendientes para este día."
                />
              ) : (
                <div className="space-y-3">
                  {activeDailyQuests.map((quest) => (
                    <DailyQuestCard
                      key={quest.id}
                      questTitle={quest.title}
                      questDescription={quest.description}
                      xpReward={quest.xpReward}
                      coinReward={quest.coinReward}
                      activityType={quest.activityType}
                      resourceUrl={quest.resourceUrl}
                      status={quest.status}
                      isSubmitting={submittingQuestId === quest.id}
                      onStart={() => { setQuestError(null); setSelectedQuest(quest); }}
                    />
                  ))}
                  {questError && <p className="font-body text-xs text-speaking-streak">{questError}</p>}
                </div>
              )}
            </DashboardSection>
          </div>

          {upcomingVirtualClasses.length > 0 && (
            <DashboardSection title="Próxima clase virtual" description="Revisa lo que tienes pendiente en tu agenda.">
              <UpcomingVirtualClasses classes={upcomingVirtualClasses} showEmptyState={false} />
            </DashboardSection>
          )}
        </div>
      </main>

      <LessonModal node={selectedNode} onClose={() => setSelectedNode(null)} onStartLesson={handleStartLesson} />
      <DailyQuestActivityDialog
        quest={selectedQuest}
        isSubmitting={selectedQuest ? submittingQuestId === selectedQuest.id : false}
        error={questError}
        onClose={() => { setSelectedQuest(null); setQuestError(null); }}
        onComplete={(questId) => {
          void handleCompleteQuest(questId).then((completed) => {
            if (completed) setSelectedQuest(null);
          });
        }}
      />
    </div>
  );
}

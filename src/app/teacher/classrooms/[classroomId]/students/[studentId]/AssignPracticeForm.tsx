'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Sparkles } from 'lucide-react';
import { assignDailyQuest, assignPracticeNode, createAndAssignDailyQuest, type AssignPracticeState } from './actions';

const initialState: AssignPracticeState = { status: 'idle', message: '' };

function AssignButton({ label = 'Asignar práctica' }: { label?: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-11 shrink-0 bg-speaking-cobalt px-5 py-2 font-body text-sm font-semibold text-white hover:bg-speaking-cobalt/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-mustard focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Asignando…' : label}
    </button>
  );
}

export function AssignPracticeForm({
  classroomId,
  studentId,
  availableNodes,
}: {
  classroomId: string;
  studentId: string;
  availableNodes: { id: string; title: string; cefrLevel: string | null }[];
}) {
  const action = assignPracticeNode.bind(null, classroomId, studentId);
  const [state, formAction] = useActionState(action, initialState);

  if (availableNodes.length === 0) {
    return <p className="mt-3 font-body text-sm text-speaking-cobalt/65">No hay otras prácticas de escucha y habla disponibles para asignar.</p>;
  }

  const levels = [...new Set(availableNodes.map((node) => node.cefrLevel ?? 'Otros'))];

  return (
    <form action={formAction} className="mt-4 space-y-3">
      <p className="max-w-3xl border-l-2 border-speaking-king/35 bg-speaking-white px-3 py-2 font-body text-sm leading-6 text-speaking-cobalt/75">
        Práctica guiada: el estudiante escucha la consigna y responde hablando. El catálogo está ordenado por nivel MCER.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="practice-node" className="sr-only">
          Seleccionar práctica
        </label>
        <select
          id="practice-node"
          name="nodeId"
          required
          defaultValue=""
          className="min-h-11 min-w-0 flex-1 border border-speaking-cobalt/20 bg-white px-3 py-2 font-body text-sm text-speaking-cobalt focus:border-speaking-cobalt focus:outline-none focus:ring-2 focus:ring-speaking-cobalt/15"
        >
          <option value="" disabled>Selecciona una práctica</option>
          {levels.map((level) => (
            <optgroup key={level} label={`Nivel ${level}`}>
              {availableNodes.filter((node) => (node.cefrLevel ?? 'Otros') === level).map((node) => (
                <option key={node.id} value={node.id}>{node.title}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <AssignButton />
      </div>
      {state.status !== 'idle' && (
        <p role={state.status === 'error' ? 'alert' : 'status'} className="font-body text-sm text-speaking-cobalt">
          {state.message}
        </p>
      )}
    </form>
  );
}

export function AssignDailyQuestForm({
  classroomId,
  studentId,
  quests,
}: {
  classroomId: string;
  studentId: string;
  quests: { id: string; title: string; description: string; xpReward: number; coinReward: number; activityType: string; resourceUrl: string | null }[];
}) {
  const action = assignDailyQuest.bind(null, classroomId, studentId);
  const [state, formAction] = useActionState(action, initialState);

  if (quests.length === 0) {
    return <p className="mt-3 font-body text-sm text-speaking-cobalt/65">No hay misiones activas en el catálogo para asignar.</p>;
  }

  return (
    <form action={formAction} className="mt-4 space-y-3">
      <p className="font-body text-sm leading-6 text-speaking-cobalt/70">Asigna un reto del catálogo para hoy. El estudiante recibirá su XP y monedas al completarlo.</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="daily-quest" className="sr-only">Seleccionar misión</label>
        <select id="daily-quest" name="questId" required defaultValue="" className="min-h-11 min-w-0 flex-1 border border-speaking-cobalt/20 bg-white px-3 py-2 font-body text-sm text-speaking-cobalt focus:border-speaking-king focus:outline-none focus:ring-2 focus:ring-speaking-king/15">
          <option value="" disabled>Selecciona una misión diaria</option>
          {quests.map((quest) => <option key={quest.id} value={quest.id}>{quest.activityType} · {quest.title} · {quest.xpReward} XP · {quest.coinReward} monedas</option>)}
        </select>
        <AssignButton label="Asignar misión" />
      </div>
      {state.status !== 'idle' && <p role={state.status === 'error' ? 'alert' : 'status'} className={`font-body text-sm ${state.status === 'error' ? 'text-speaking-streak' : 'text-speaking-success'}`}>{state.message}</p>}
    </form>
  );
}

export function CreateTeacherMissionForm({
  classroomId,
  studentId,
  studentName,
  classroomName,
  practices,
}: {
  classroomId: string;
  studentId: string;
  studentName: string;
  classroomName: string;
  practices: { id: string; title: string; cefrLevel: string | null }[];
}) {
  const action = createAndAssignDailyQuest.bind(null, classroomId, studentId);
  const [state, formAction] = useActionState(action, initialState);
  const [activityType, setActivityType] = useState('SPEAKING');

  return (
    <form action={formAction} className="mt-5 overflow-hidden rounded-xl border border-speaking-cobalt/15 bg-white shadow-[0_6px_20px_rgba(16,52,105,0.06)]">
      <div className="flex items-start gap-3 border-b border-speaking-cobalt/10 bg-speaking-cobalt/[0.035] px-4 py-4 sm:px-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-speaking-mustard/20 text-speaking-cobalt"><Sparkles className="h-5 w-5" aria-hidden="true" /></span>
        <div className="min-w-0">
          <p className="font-body text-xs font-bold uppercase tracking-[0.1em] text-speaking-king">Actividad personalizada</p>
          <h3 className="mt-1 font-title text-xl text-speaking-cobalt">Crear misión personalizada</h3>
          <p className="mt-1 font-body text-sm leading-6 text-speaking-cobalt/75">Para {studentName} · {classroomName}. La verá en sus misiones del día.</p>
        </div>
      </div>
      <div className="space-y-4 p-4 sm:p-5">
        <p className="font-body text-sm leading-6 text-speaking-cobalt/75">Diseña una actividad de expresión oral, comprensión auditiva, práctica, vídeo, juego, tema o vocabulario. Para vídeo o juego, añade un enlace HTTPS.</p>
        <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="teacher-mission-title" className="block font-body text-sm font-semibold text-speaking-cobalt">Título</label>
          <input id="teacher-mission-title" name="title" required minLength={3} maxLength={100} className="mt-1.5 min-h-11 w-full rounded-lg border border-speaking-cobalt/20 bg-white px-3 font-body text-sm text-speaking-cobalt shadow-sm focus:border-speaking-king focus:outline-none focus:ring-2 focus:ring-speaking-king/15" />
        </div>
        <div>
          <label htmlFor="teacher-mission-type" className="block font-body text-sm font-semibold text-speaking-cobalt">Tipo de misión</label>
          <select id="teacher-mission-type" name="activityType" required value={activityType} onChange={(event) => setActivityType(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-lg border border-speaking-cobalt/20 bg-white px-3 font-body text-sm text-speaking-cobalt shadow-sm focus:border-speaking-king focus:outline-none focus:ring-2 focus:ring-speaking-king/15">
            <option value="SPEAKING">Speaking</option>
            <option value="LISTENING">Listening</option>
            <option value="PRACTICE">Práctica específica</option>
            <option value="VIDEO">Ver vídeo</option>
            <option value="GAME">Jugar</option>
            <option value="TOPIC">Practicar un tema</option>
            <option value="VOCABULARY">Memorizar vocabulario</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="teacher-mission-instructions" className="block font-body text-sm font-semibold text-speaking-cobalt">Instrucciones para el estudiante</label>
          <textarea id="teacher-mission-instructions" name="description" required minLength={10} maxLength={1000} rows={3} placeholder="Describe qué debe hacer y cómo completar la actividad." className="mt-1.5 w-full resize-y rounded-lg border border-speaking-cobalt/20 bg-white px-3 py-2 font-body text-sm leading-6 text-speaking-cobalt shadow-sm focus:border-speaking-king focus:outline-none focus:ring-2 focus:ring-speaking-king/15" />
        </div>
        <div>
          <label htmlFor="teacher-mission-practice" className="block font-body text-sm font-semibold text-speaking-cobalt">Práctica a desbloquear</label>
          <select id="teacher-mission-practice" name="practiceNodeId" required={activityType === 'PRACTICE'} disabled={activityType !== 'PRACTICE'} defaultValue="" className="mt-1.5 min-h-11 w-full rounded-lg border border-speaking-cobalt/20 bg-white px-3 font-body text-sm text-speaking-cobalt shadow-sm focus:border-speaking-king focus:outline-none focus:ring-2 focus:ring-speaking-king/15 disabled:bg-speaking-white disabled:text-speaking-cobalt/70">
            <option value="">Selecciona una práctica</option>
            {practices.map((practice) => <option key={practice.id} value={practice.id}>{practice.cefrLevel ?? 'Sin nivel'} · {practice.title}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="teacher-mission-resource" className="block font-body text-sm font-semibold text-speaking-cobalt">Enlace HTTPS a vídeo o juego</label>
          <input id="teacher-mission-resource" name="resourceUrl" type="url" required={activityType === 'VIDEO' || activityType === 'GAME'} placeholder="https://…" className="mt-1.5 min-h-11 w-full rounded-lg border border-speaking-cobalt/20 bg-white px-3 font-body text-sm text-speaking-cobalt shadow-sm focus:border-speaking-king focus:outline-none focus:ring-2 focus:ring-speaking-king/15" />
        </div>
        <div>
          <label htmlFor="teacher-mission-xp" className="block font-body text-sm font-semibold text-speaking-cobalt">XP al completar</label>
          <input id="teacher-mission-xp" name="xpReward" type="number" min={0} max={500} step={1} required defaultValue={30} className="mt-1.5 min-h-11 w-full rounded-lg border border-speaking-cobalt/20 bg-white px-3 font-body text-sm text-speaking-cobalt shadow-sm focus:border-speaking-king focus:outline-none focus:ring-2 focus:ring-speaking-king/15" />
        </div>
        <div>
          <label htmlFor="teacher-mission-coins" className="block font-body text-sm font-semibold text-speaking-cobalt">Monedas al completar</label>
          <input id="teacher-mission-coins" name="coinReward" type="number" min={0} max={500} step={1} required defaultValue={10} className="mt-1.5 min-h-11 w-full rounded-lg border border-speaking-cobalt/20 bg-white px-3 font-body text-sm text-speaking-cobalt shadow-sm focus:border-speaking-king focus:outline-none focus:ring-2 focus:ring-speaking-king/15" />
        </div>
        </div>
        {state.status !== 'idle' && <p role={state.status === 'error' ? 'alert' : 'status'} className={`font-body text-sm ${state.status === 'error' ? 'text-speaking-streak' : 'text-speaking-success'}`}>{state.message}</p>}
        <AssignButton label="Crear y asignar misión" />
      </div>
    </form>
  );
}

'use client';

import { useState } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { recordClassLesson, type ClassLessonFormState } from './lesson-actions';

const initialState: ClassLessonFormState = { status: 'idle', message: '', resetKey: 0 };

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-11 items-center justify-center bg-speaking-cobalt px-5 py-2 font-body text-sm font-semibold text-white hover:bg-speaking-cobalt/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-mustard focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Guardando…' : 'Guardar y compartir'}
    </button>
  );
}

export function ClassLessonForm({
  classroomId,
  students,
  practiceNodes,
  virtualClassId,
  initialTitle = '',
  initialTaughtAt,
  initialTaughtAtLabel,
  initialNotes = '',
  initialImprovements = '',
  initialHomework = '',
  initialPracticeNodeId = '',
  initialRecipientIds = [],
}: {
  classroomId: string;
  students: { id: string; name: string }[];
  practiceNodes: { id: string; title: string }[];
  virtualClassId?: string;
  initialTitle?: string;
  initialTaughtAt?: string;
  initialTaughtAtLabel?: string;
  initialNotes?: string;
  initialImprovements?: string;
  initialHomework?: string;
  initialPracticeNodeId?: string;
  initialRecipientIds?: string[];
}) {
  const action = recordClassLesson.bind(null, classroomId);
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-5 space-y-5">
      {virtualClassId && <input type="hidden" name="virtualClassId" value={virtualClassId} />}
      <ClassLessonFields
        students={students}
        practiceNodes={practiceNodes}
        virtualClassId={virtualClassId}
        initialTitle={initialTitle}
        initialTaughtAt={initialTaughtAt}
        initialTaughtAtLabel={initialTaughtAtLabel}
        initialNotes={initialNotes}
        initialImprovements={initialImprovements}
        initialHomework={initialHomework}
        initialPracticeNodeId={initialPracticeNodeId}
        initialRecipientIds={initialRecipientIds}
      />
      {state.status !== 'idle' && (
        <p role={state.status === 'error' ? 'alert' : 'status'} className="font-body text-sm text-speaking-cobalt">
          {state.message}
        </p>
      )}
      <SaveButton />
    </form>
  );
}

function ClassLessonFields({
  students,
  practiceNodes,
  virtualClassId,
  initialTitle,
  initialTaughtAt,
  initialTaughtAtLabel,
  initialNotes,
  initialImprovements,
  initialHomework,
  initialPracticeNodeId,
  initialRecipientIds,
}: {
  students: { id: string; name: string }[];
  practiceNodes: { id: string; title: string }[];
  virtualClassId?: string;
  initialTitle: string;
  initialTaughtAt?: string;
  initialTaughtAtLabel?: string;
  initialNotes: string;
  initialImprovements: string;
  initialHomework: string;
  initialPracticeNodeId: string;
  initialRecipientIds: string[];
}) {
  const [recipientMode, setRecipientMode] = useState<'CLASS' | 'SELECTED'>(initialRecipientIds.length > 0 ? 'SELECTED' : 'CLASS');
  const [selectedRecipientIds, setSelectedRecipientIds] = useState(initialRecipientIds);
  const [title, setTitle] = useState(initialTitle);
  const [taughtAt, setTaughtAt] = useState(initialTaughtAt ?? '');
  const [notes, setNotes] = useState(initialNotes);
  const [improvements, setImprovements] = useState(initialImprovements);
  const [homework, setHomework] = useState(initialHomework);
  const [practiceNodeId, setPracticeNodeId] = useState(initialPracticeNodeId);

  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="font-body text-sm font-semibold text-speaking-cobalt">Destinatarios</legend>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:gap-6">
          <label className="inline-flex min-h-10 items-center gap-2 font-body text-sm text-speaking-cobalt">
            <input
              type="radio"
              name="recipientMode"
              value="CLASS"
              checked={recipientMode === 'CLASS'}
              onChange={() => setRecipientMode('CLASS')}
            />
            Todo el grupo ({students.length})
          </label>
          <label className="inline-flex min-h-10 items-center gap-2 font-body text-sm text-speaking-cobalt">
            <input
              type="radio"
              name="recipientMode"
              value="SELECTED"
              checked={recipientMode === 'SELECTED'}
              onChange={() => setRecipientMode('SELECTED')}
            />
            Elegir estudiantes
          </label>
        </div>
        {recipientMode === 'SELECTED' && (
          <div className="mt-3 grid gap-x-5 gap-y-1 sm:grid-cols-2">
            {students.length === 0 ? (
              <p className="font-body text-sm text-speaking-cobalt/65">No hay estudiantes activos para seleccionar.</p>
            ) : students.map((student) => (
              <label key={student.id} className="inline-flex min-h-10 items-center gap-2 font-body text-sm text-speaking-cobalt">
                <input
                  type="checkbox"
                  name="studentIds"
                  value={student.id}
                  checked={selectedRecipientIds.includes(student.id)}
                  onChange={(event) => setSelectedRecipientIds((current) => (
                    event.target.checked
                      ? [...current, student.id]
                      : current.filter((id) => id !== student.id)
                  ))}
                />
                {student.name}
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="class-lesson-title" className="block font-body text-sm font-semibold text-speaking-cobalt">Título de la clase</label>
          <input id="class-lesson-title" name="title" value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={120} className="mt-1 min-h-11 w-full border border-speaking-cobalt/20 bg-white px-3 py-2 font-body text-sm text-speaking-cobalt outline-none focus:border-speaking-cobalt focus:ring-2 focus:ring-speaking-cobalt/15" />
        </div>
        <div>
          <label htmlFor="class-lesson-date" className="block font-body text-sm font-semibold text-speaking-cobalt">Fecha y hora</label>
          {virtualClassId && initialTaughtAt ? (
            <>
              <input type="hidden" name="taughtAt" value={initialTaughtAt} />
              <p className="mt-2 min-h-11 border border-speaking-cobalt/10 bg-white px-3 py-3 font-body text-sm text-speaking-cobalt/75">{initialTaughtAtLabel}</p>
            </>
          ) : (
            <input id="class-lesson-date" name="taughtAt" type="datetime-local" value={taughtAt} onChange={(event) => setTaughtAt(event.target.value)} required className="mt-1 min-h-11 w-full border border-speaking-cobalt/20 bg-white px-3 py-2 font-body text-sm text-speaking-cobalt outline-none focus:border-speaking-cobalt focus:ring-2 focus:ring-speaking-cobalt/15" />
          )}
        </div>
      </div>

      <fieldset className="space-y-4 rounded-xl border border-speaking-cobalt/12 bg-speaking-white p-4 sm:p-5">
        <legend className="px-1 font-title text-base text-speaking-cobalt">Seguimiento pedagógico</legend>
        <div>
          <label htmlFor="class-lesson-notes" className="block font-body text-sm font-semibold text-speaking-cobalt">Apuntes de la clase</label>
          <textarea id="class-lesson-notes" name="notes" value={notes} onChange={(event) => setNotes(event.target.value)} required maxLength={5000} rows={4} className="mt-1 w-full resize-y border border-speaking-cobalt/20 bg-white px-3 py-2 font-body text-sm leading-6 text-speaking-cobalt outline-none focus:border-speaking-cobalt focus:ring-2 focus:ring-speaking-cobalt/15" />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <label htmlFor="class-lesson-improvements" className="block font-body text-sm font-semibold text-speaking-cobalt">Oportunidades de mejora</label>
            <textarea id="class-lesson-improvements" name="improvements" value={improvements} onChange={(event) => setImprovements(event.target.value)} maxLength={3000} rows={3} className="mt-1 w-full resize-y border border-speaking-cobalt/20 bg-white px-3 py-2 font-body text-sm leading-6 text-speaking-cobalt outline-none focus:border-speaking-cobalt focus:ring-2 focus:ring-speaking-cobalt/15" />
          </div>

          <div>
            <label htmlFor="class-lesson-homework" className="block font-body text-sm font-semibold text-speaking-cobalt">Tareas</label>
            <textarea id="class-lesson-homework" name="homework" value={homework} onChange={(event) => setHomework(event.target.value)} maxLength={3000} rows={3} className="mt-1 w-full resize-y border border-speaking-cobalt/20 bg-white px-3 py-2 font-body text-sm leading-6 text-speaking-cobalt outline-none focus:border-speaking-cobalt focus:ring-2 focus:ring-speaking-cobalt/15" />
          </div>
        </div>

        <div>
          <label htmlFor="class-lesson-practice" className="block font-body text-sm font-semibold text-speaking-cobalt">Práctica del currículo</label>
          <select id="class-lesson-practice" name="practiceNodeId" value={practiceNodeId} onChange={(event) => setPracticeNodeId(event.target.value)} className="mt-1 min-h-11 w-full border border-speaking-cobalt/20 bg-white px-3 py-2 font-body text-sm text-speaking-cobalt outline-none focus:border-speaking-cobalt focus:ring-2 focus:ring-speaking-cobalt/15">
            <option value="">Sin asignar práctica</option>
            {practiceNodes.map((node) => <option key={node.id} value={node.id}>{node.title}</option>)}
          </select>
          <p className="mt-1 font-body text-xs text-speaking-cobalt/60">La práctica se desbloquea para los destinatarios seleccionados.</p>
        </div>
      </fieldset>
    </div>
  );
}
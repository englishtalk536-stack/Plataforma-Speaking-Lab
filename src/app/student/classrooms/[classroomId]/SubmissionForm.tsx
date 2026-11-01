'use client';

import { useState, type FormEvent } from 'react';
import { saveActivitySubmission, type SubmissionFormState } from './actions';

const initialState: SubmissionFormState = { status: 'idle', message: '' };

export function SubmissionForm({
  classroomId,
  activityId,
  initialResponse,
}: {
  classroomId: string;
  activityId: string;
  initialResponse: string;
}) {
  const [savedResponse, setSavedResponse] = useState(initialResponse);
  const [draft, setDraft] = useState(initialResponse);
  const [isEditing, setIsEditing] = useState(!initialResponse);
  const [isSaving, setIsSaving] = useState(false);
  const [state, setState] = useState(initialState);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    setState(initialState);
    try {
      const result = await saveActivitySubmission(
        classroomId,
        activityId,
        initialState,
        new FormData(event.currentTarget),
      );
      setState(result);
      if (result.status === 'success') {
        const normalizedResponse = draft.trim();
        setSavedResponse(normalizedResponse);
        setDraft(normalizedResponse);
        setIsEditing(false);
      }
    } catch {
      setState({ status: 'error', message: 'No se pudo guardar la respuesta. Inténtalo de nuevo.' });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mt-5 border-t border-speaking-cobalt/10 pt-4">
      {!isEditing ? (
        <div className="border-l-2 border-speaking-success/60 bg-speaking-success/5 p-4 sm:p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-body text-sm font-semibold text-speaking-cobalt">Tu respuesta</h4>
              <span className="inline-flex min-h-7 items-center bg-speaking-success/10 px-2.5 font-body text-xs font-semibold text-speaking-success">Entregada</span>
            </div>
          </div>
          <p className="mt-3 whitespace-pre-wrap break-words font-body text-sm leading-6 text-speaking-cobalt/80">
            {savedResponse}
          </p>
          <p className="mt-3 font-body text-xs text-speaking-cobalt/60">La entrega queda cerrada después de enviarla.</p>
          {state.status === 'success' && <p role="status" className="mt-3 font-body text-sm text-speaking-cobalt">{state.message}</p>}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 border-l-4 border-speaking-king bg-speaking-white p-4 sm:p-5">
          <div>
            <label htmlFor={`response-${activityId}`} className="block font-body text-sm font-semibold text-speaking-cobalt">
              Tu respuesta
            </label>
            <textarea
              id={`response-${activityId}`}
              name="responseText"
              required
              maxLength={5000}
              rows={6}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              aria-invalid={state.status === 'error'}
              aria-describedby={`response-message-${activityId}`}
              placeholder="Organiza tus ideas y escribe tu respuesta aquí…"
              className="mt-1 min-h-48 w-full resize-y border border-speaking-cobalt/20 bg-white px-3.5 py-3 font-body text-sm leading-6 text-speaking-cobalt outline-none transition focus:border-speaking-king focus:ring-2 focus:ring-speaking-king/15"
            />
          </div>

          {state.status !== 'idle' && state.status === 'error' && (
            <p id={`response-message-${activityId}`} role="alert" className="font-body text-sm text-speaking-streak">
              {state.message}
            </p>
          )}

          <div className="flex flex-col gap-2 border-t border-speaking-cobalt/10 pt-4 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex min-h-11 items-center justify-center bg-speaking-cobalt px-5 py-2 font-body text-sm font-semibold text-white transition-colors hover:bg-speaking-cobalt/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-mustard focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? 'Guardando…' : 'Enviar actividad'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
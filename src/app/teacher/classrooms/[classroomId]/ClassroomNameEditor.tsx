'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { renameClassroom, type RenameClassroomState } from './actions';

const initialState: RenameClassroomState = { status: 'idle', message: '' };

export function ClassroomNameEditor({ classroomId, currentName }: { classroomId: string; currentName: string }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(currentName);
  const [name, setName] = useState(currentName);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<RenameClassroomState>(initialState);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    setMessage(initialState);
    try {
      const result = await renameClassroom(classroomId, initialState, new FormData(event.currentTarget));
      setMessage(result);
      if (result.status === 'success') {
        const updatedName = name.trim();
        setDisplayName(updatedName);
        setIsEditing(false);
        router.refresh();
      }
    } catch {
      setMessage({ status: 'error', message: 'No se pudo actualizar el nombre. Inténtalo de nuevo.' });
    } finally {
      setIsSaving(false);
    }
  }

  function cancel() {
    setName(displayName);
    setMessage(initialState);
    setIsEditing(false);
  }

  return (
    <div className="w-full sm:w-auto sm:min-w-56">
      {!isEditing ? (
        <div className="flex flex-col gap-1 sm:items-end">
          <span className="font-body text-sm font-semibold text-speaking-cobalt">{displayName}</span>
          <button
            type="button"
            onClick={() => { setName(displayName); setMessage(initialState); setIsEditing(true); }}
            className="inline-flex min-h-10 items-center font-body text-sm font-semibold text-speaking-cobalt underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-cobalt focus-visible:outline-offset-2"
          >
            Editar nombre
          </button>
          {message.status === 'success' && <p role="status" className="font-body text-xs text-speaking-success">{message.message}</p>}
        </div>
      ) : (
        <form onSubmit={submit} className="w-full space-y-3 sm:min-w-72">
          <div>
            <label htmlFor="classroom-name" className="block font-body text-sm font-semibold text-speaking-cobalt">Nombre del aula</label>
            <input
              id="classroom-name"
              name="name"
              type="text"
              required
              minLength={2}
              maxLength={80}
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-describedby="classroom-name-help"
              aria-invalid={message.status === 'error'}
              className="mt-1 min-h-11 w-full border border-speaking-cobalt/20 bg-white px-3 py-2 font-body text-sm text-speaking-cobalt outline-none focus:border-speaking-cobalt focus:ring-2 focus:ring-speaking-cobalt/15"
            />
            <p id="classroom-name-help" className="mt-1 font-body text-xs text-speaking-cobalt/60">Entre 2 y 80 caracteres.</p>
          </div>
          {message.status === 'error' && <p role="alert" className="font-body text-sm text-speaking-streak">{message.message}</p>}
          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="submit" disabled={isSaving} className="inline-flex min-h-11 items-center justify-center bg-speaking-cobalt px-4 font-body text-sm font-semibold text-white hover:bg-speaking-cobalt/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-cobalt focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-60">
              {isSaving ? 'Guardando…' : 'Guardar'}
            </button>
            <button type="button" disabled={isSaving} onClick={cancel} className="inline-flex min-h-11 items-center justify-center border border-speaking-cobalt/20 px-4 font-body text-sm font-semibold text-speaking-cobalt hover:bg-speaking-cobalt/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-cobalt focus-visible:outline-offset-2 disabled:opacity-60">
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

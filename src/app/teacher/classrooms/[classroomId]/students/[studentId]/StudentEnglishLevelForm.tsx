'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { StatusBadge } from '../../../../../../components/ui/StatusBadge';
import { updateStudentEnglishLevel } from './level-actions';

type EnglishLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
const levels: EnglishLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export function StudentEnglishLevelForm({
  classroomId,
  studentId,
  studentName,
  currentLevel,
}: {
  classroomId: string;
  studentId: string;
  studentName: string;
  currentLevel: EnglishLevel | null;
}) {
  const router = useRouter();
  const [level, setLevel] = useState<EnglishLevel | ''>(currentLevel ?? '');
  const [reason, setReason] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!level || isSaving) return;
    if (level === currentLevel) {
      setMessage({ type: 'error', text: 'El nivel seleccionado ya está asignado.' });
      return;
    }

    const previous = currentLevel ?? 'Sin nivel asignado';
    if (!window.confirm(`¿Actualizar el nivel de ${studentName} de ${previous} a ${level}?`)) return;

    setIsSaving(true);
    setMessage(null);
    try {
      const result = await updateStudentEnglishLevel(classroomId, studentId, new FormData(event.currentTarget));
      if (!result.ok) {
        setMessage({ type: 'error', text: result.message });
        return;
      }
      setLevel(result.newLevel);
      setReason('');
      setIsEditing(false);
      setMessage({ type: 'success', text: `Nivel actualizado a ${result.newLevel}.` });
      router.refresh();
    } catch {
      setMessage({ type: 'error', text: 'No se pudo guardar el nivel. Inténtalo de nuevo.' });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="font-body text-sm text-speaking-cobalt/70">Nivel actual</span>
          {currentLevel ? <StatusBadge tone="info">{currentLevel}</StatusBadge> : <StatusBadge tone="neutral">Sin nivel asignado</StatusBadge>}
        </div>
        {!isEditing && (
          <button
            type="button"
            onClick={() => { setLevel(currentLevel ?? ''); setReason(''); setMessage(null); setIsEditing(true); }}
            className="inline-flex min-h-10 items-center justify-center border border-speaking-cobalt/20 px-3 font-body text-sm font-semibold text-speaking-cobalt hover:bg-speaking-cobalt/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-cobalt focus-visible:outline-offset-2"
          >
            Actualizar nivel
          </button>
        )}
      </div>

      {isEditing && (
        <form onSubmit={submit} className="mt-4 space-y-4 border-t border-speaking-cobalt/10 pt-4">
          <div>
            <label htmlFor="student-english-level" className="block font-body text-sm font-semibold text-speaking-cobalt">Nuevo nivel</label>
            <select
              id="student-english-level"
              name="englishLevel"
              required
              value={level}
              onChange={(event) => setLevel(event.target.value as EnglishLevel | '')}
              className="mt-1 min-h-11 w-full border border-speaking-cobalt/20 bg-white px-3 font-body text-sm text-speaking-cobalt outline-none focus:border-speaking-cobalt focus:ring-2 focus:ring-speaking-cobalt/15"
            >
              <option value="" disabled>Selecciona un nivel</option>
              {levels.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="student-english-level-reason" className="block font-body text-sm font-semibold text-speaking-cobalt">Motivo del cambio <span className="font-normal text-speaking-cobalt/60">(opcional)</span></label>
            <textarea
              id="student-english-level-reason"
              name="reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={500}
              rows={2}
              className="mt-1 w-full resize-y border border-speaking-cobalt/20 bg-white px-3 py-2 font-body text-sm leading-6 text-speaking-cobalt outline-none focus:border-speaking-cobalt focus:ring-2 focus:ring-speaking-cobalt/15"
            />
            <p className="mt-1 font-body text-xs text-speaking-cobalt/60">Hasta 500 caracteres.</p>
          </div>
          <p className="font-body text-xs leading-5 text-speaking-cobalt/65">Este nivel se aplica sólo a esta matrícula y no cambia XP, prácticas ni el nivel del aula.</p>
          {message && <p role={message.type === 'error' ? 'alert' : 'status'} className={`font-body text-sm ${message.type === 'error' ? 'text-speaking-streak' : 'text-speaking-success'}`}>{message.text}</p>}
          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="submit" disabled={isSaving || !level} className="inline-flex min-h-11 items-center justify-center bg-speaking-cobalt px-4 font-body text-sm font-semibold text-white hover:bg-speaking-cobalt/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-cobalt focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60">
              {isSaving ? 'Guardando…' : 'Guardar nivel'}
            </button>
            <button type="button" disabled={isSaving} onClick={() => { setLevel(currentLevel ?? ''); setReason(''); setMessage(null); setIsEditing(false); }} className="inline-flex min-h-11 items-center justify-center border border-speaking-cobalt/20 px-4 font-body text-sm font-semibold text-speaking-cobalt hover:bg-speaking-cobalt/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-cobalt focus-visible:outline-offset-2 disabled:opacity-60">
              Cancelar
            </button>
          </div>
        </form>
      )}
      {message && !isEditing && <p role={message.type === 'error' ? 'alert' : 'status'} className="mt-3 font-body text-sm text-speaking-success">{message.text}</p>}
    </div>
  );
}

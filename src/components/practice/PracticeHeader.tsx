'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, ChevronDown } from 'lucide-react';
import type { CEFRLevel, TeacherNote } from '../../lib/ai/practice-context';

export interface PracticeHeaderProps {
  cefrLevel: CEFRLevel;
  cefrName: string;
  exerciseTitle: string;
  currentTurn: number;
  totalTurns: number;
  teacherNote: TeacherNote | null;
}

/**
 * Session header: CEFR level + exercise title, a turn-progress bar, and (if
 * the teacher left one) an interactive badge with their note — collapsed by
 * default so it doesn't compete with the challenge itself, expandable on
 * click for the full observation.
 */
export function PracticeHeader({
  cefrLevel,
  cefrName,
  exerciseTitle,
  currentTurn,
  totalTurns,
  teacherNote,
}: PracticeHeaderProps) {
  const [noteExpanded, setNoteExpanded] = useState(false);
  const percent = Math.min(100, Math.round((currentTurn / totalTurns) * 100));

  return (
    <header className="rounded-2xl bg-speaking-cobalt px-6 py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-speaking-mustard px-3 py-1 font-title text-xs text-speaking-cobalt">
            {cefrLevel} - {cefrName}
          </span>
          <h1 className="mt-2 font-title text-2xl text-speaking-white">{exerciseTitle}</h1>
        </div>

        <p className="font-body text-sm text-speaking-white/70">
          Turn {Math.min(currentTurn + 1, totalTurns)} of {totalTurns}
        </p>
      </div>

      <div
        className="mt-4 h-2 w-full overflow-hidden rounded-full bg-speaking-white/15"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Session progress"
      >
        <motion.div
          className="h-full rounded-full bg-speaking-mustard"
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      {teacherNote && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setNoteExpanded((open) => !open)}
            aria-expanded={noteExpanded}
            className="flex items-center gap-2 rounded-full border border-speaking-king/60 bg-speaking-king/20 px-3 py-1.5 font-body text-xs font-semibold text-speaking-white transition-colors hover:bg-speaking-king/30"
          >
            <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{teacherNote.title}</span>
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${noteExpanded ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>

          {noteExpanded && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 max-w-xl font-body text-xs text-speaking-white/70"
            >
              {teacherNote.detail}
            </motion.p>
          )}
        </div>
      )}
    </header>
  );
}

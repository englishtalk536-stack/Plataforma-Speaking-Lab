'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { SkillPathNodeDto } from '../../lib/types/dashboard';

export interface LessonModalProps {
  node: SkillPathNodeDto | null;
  onClose: () => void;
  onStartLesson: (node: SkillPathNodeDto) => void;
}

/**
 * Brand-styled modal for starting the lesson behind a CURRENT skill node.
 * Mounted once near the page root; `node` being non-null is what opens it,
 * so opening/closing is driven entirely by the parent's selection state.
 */
export function LessonModal({ node, onClose, onStartLesson }: LessonModalProps) {
  return (
    <AnimatePresence>
      {node && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-speaking-cobalt/60 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="lesson-modal-title"
            className="w-full max-w-sm rounded-2xl bg-speaking-white p-6 shadow-xl"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <p className="font-title text-xl text-speaking-cobalt" id="lesson-modal-title">
                {node.title}
              </p>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-full p-1 text-speaking-locked hover:bg-speaking-cobalt/5"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <p className="mt-2 font-body text-sm text-speaking-cobalt/70">
              Ready to practice this skill? You&apos;ll complete a short voice exercise and earn XP toward your next
              level.
            </p>

            <div className="mt-4 inline-flex items-center rounded-full bg-speaking-success/10 px-3 py-1 font-body text-xs font-semibold text-speaking-success">
              +{node.xpReward} XP on completion
            </div>

            <button
              type="button"
              onClick={() => onStartLesson(node)}
              className="mt-5 w-full rounded-full bg-speaking-king py-2.5 font-body text-sm font-semibold text-speaking-white transition-colors hover:bg-speaking-cobalt"
            >
              Start lesson
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

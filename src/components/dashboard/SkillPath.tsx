'use client';

import { Check, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import type { SkillPathNodeDto, WireNodeStatus } from '../../lib/types/dashboard';

export type SkillPathNode = SkillPathNodeDto;

export interface SkillPathProps {
  nodes: SkillPathNodeDto[];
  /** id of the node currently highlighted (e.g. open in the lesson modal). */
  selectedNodeId?: string | null;
  onSelectNode?: (node: SkillPathNodeDto) => void;
  className?: string;
}

const ROW_HEIGHT = 108;
const NODE_RADIUS = 26;

const STATUS_STYLES: Record<WireNodeStatus, { ring: string; fill: string; icon: 'lock' | 'check' | null }> = {
  LOCKED: { ring: 'ring-speaking-locked/40', fill: 'bg-speaking-white text-speaking-locked', icon: 'lock' },
  CURRENT: { ring: 'ring-speaking-king', fill: 'bg-speaking-king text-speaking-white', icon: null },
  COMPLETED: { ring: 'ring-speaking-success', fill: 'bg-speaking-success text-speaking-white', icon: 'check' },
};

/**
 * Renders the skill tree as a winding path — alternating left/right nodes
 * joined by a connecting line — rather than a grid of lesson cards. This
 * mirrors what "skill tree" actually means for the subject (a sequence of
 * unlocks) instead of a generic content grid.
 *
 * CURRENT and COMPLETED nodes are clickable. Completed nodes reopen the
 * lesson in review mode, while LOCKED nodes remain informational only.
 */
export function SkillPath({ nodes, selectedNodeId = null, onSelectNode, className = '' }: SkillPathProps) {
  const width = 320;
  const leftX = width * 0.28;
  const rightX = width * 0.72;
  const height = Math.max(nodes.length * ROW_HEIGHT, ROW_HEIGHT);

  const centers = nodes.map((_, index) => ({
    x: index % 2 === 0 ? leftX : rightX,
    y: ROW_HEIGHT / 2 + index * ROW_HEIGHT,
  }));

  const pathData = centers
    .map((point, index) => (index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`))
    .join(' ');

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <path d={pathData} fill="none" stroke="#64748B" strokeOpacity={0.25} strokeWidth={3} strokeDasharray="2 10" strokeLinecap="round" />
      </svg>

      <ol className="relative">
        {nodes.map((node, index) => {
          const style = STATUS_STYLES[node.status];
          const point = centers[index];
          const isInteractive = node.status === 'CURRENT' || node.status === 'COMPLETED';
          const isSelected = node.id === selectedNodeId;

          return (
            <li
              key={node.id}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              style={{ left: `${(point.x / width) * 100}%`, top: point.y }}
            >
              <motion.button
                type="button"
                disabled={!isInteractive}
                onClick={() => isInteractive && onSelectNode?.(node)}
                aria-label={`${node.title} — ${node.status.toLowerCase()}`}
                aria-pressed={isInteractive ? isSelected : undefined}
                animate={{ scale: isSelected ? 1.12 : 1 }}
                whileTap={isInteractive ? { scale: 0.95 } : undefined}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className={`flex items-center justify-center rounded-full ring-2 ${style.ring} ${style.fill} ${
                  isInteractive ? 'cursor-pointer' : 'cursor-not-allowed opacity-90'
                }`}
                style={{ width: NODE_RADIUS * 2, height: NODE_RADIUS * 2 }}
              >
                {style.icon === 'lock' && <Lock className="h-5 w-5" aria-hidden="true" />}
                {style.icon === 'check' && <Check className="h-6 w-6" aria-hidden="true" />}
                {style.icon === null && <span className="font-title text-sm">{index + 1}</span>}
              </motion.button>
              <span className="mt-2 max-w-[8.5rem] text-center font-body text-xs font-semibold text-speaking-cobalt">
                {node.title}
              </span>
              <span className="font-body text-[11px] text-speaking-cobalt/60">+{node.xpReward} XP</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

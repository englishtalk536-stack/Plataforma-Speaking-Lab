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

const ROW_HEIGHT = 116;
const NODE_RADIUS = 28;

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

  const pathData = centers.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const previous = centers[index - 1];
    const middleY = (previous.y + point.y) / 2;
    return `${path} C ${previous.x} ${middleY}, ${point.x} ${middleY}, ${point.x} ${point.y}`;
  }, '');

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <path d={pathData} fill="none" stroke="#103469" strokeOpacity={0.12} strokeWidth={8} strokeLinecap="round" />
        <path d={pathData} fill="none" stroke="#205088" strokeOpacity={0.5} strokeWidth={2.5} strokeDasharray="3 9" strokeLinecap="round" />
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
                className={`flex items-center justify-center rounded-2xl ring-2 shadow-[0_5px_14px_rgba(16,52,105,0.12)] transition-shadow ${style.ring} ${style.fill} ${
                  isInteractive ? 'cursor-pointer hover:shadow-[0_8px_20px_rgba(16,52,105,0.20)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-mustard focus-visible:outline-offset-4' : 'cursor-not-allowed opacity-90'
                }`}
                style={{ width: NODE_RADIUS * 2, height: NODE_RADIUS * 2 }}
              >
                {style.icon === 'lock' && <Lock className="h-5 w-5" aria-hidden="true" />}
                {style.icon === 'check' && <Check className="h-6 w-6" aria-hidden="true" />}
                {style.icon === null && <span className="font-title text-sm">{index + 1}</span>}
              </motion.button>
              <span className={`mt-2 max-w-[8.5rem] text-center font-body text-xs font-semibold ${node.status === 'LOCKED' ? 'text-speaking-cobalt/70' : 'text-speaking-cobalt'}`}>
                {node.title}
              </span>
              <span className={`mt-0.5 rounded-full px-2 py-0.5 font-body text-xs font-semibold ${node.status === 'COMPLETED' ? 'bg-speaking-success/10 text-speaking-success' : node.status === 'CURRENT' ? 'bg-speaking-mustard/20 text-speaking-cobalt' : 'bg-speaking-cobalt/5 text-speaking-cobalt/70'}`}>{node.status === 'COMPLETED' ? 'Completado' : node.status === 'CURRENT' ? 'En curso' : 'Bloqueado'} · +{node.xpReward} XP</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

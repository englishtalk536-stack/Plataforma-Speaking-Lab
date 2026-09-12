'use client';

import { Check, Lock } from 'lucide-react';
import type { NodeStatus } from '@/types/dashboard';

export interface SkillPathNode {
  id: string;
  title: string;
  xpReward: number;
  status: NodeStatus;
}

export interface SkillPathProps {
  nodes: SkillPathNode[];
  onSelectNode?: (node: SkillPathNode) => void;
  className?: string;
}

const ROW_HEIGHT = 108;
const NODE_RADIUS = 26;

const STATUS_STYLES: Record<NodeStatus, { ring: string; fill: string; icon: 'lock' | 'check' | null }> = {
  LOCKED: { ring: 'ring-speaking-locked/40', fill: 'bg-speaking-white text-speaking-locked', icon: 'lock' },
  UNLOCKED: { ring: 'ring-speaking-king', fill: 'bg-speaking-king text-speaking-white', icon: null },
  COMPLETED: { ring: 'ring-speaking-success', fill: 'bg-speaking-success text-speaking-white', icon: 'check' },
};

/**
 * Renders the skill tree as a winding path — alternating left/right nodes
 * joined by a connecting line — rather than a grid of lesson cards. This
 * mirrors what "skill tree" actually means for the subject (a sequence of
 * unlocks) instead of a generic content grid.
 */
export function SkillPath({ nodes, onSelectNode, className = '' }: SkillPathProps) {
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
          const isInteractive = node.status !== 'LOCKED';

          return (
            <li
              key={node.id}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              style={{ left: `${(point.x / width) * 100}%`, top: point.y }}
            >
              <button
                type="button"
                disabled={!isInteractive}
                onClick={() => isInteractive && onSelectNode?.(node)}
                aria-label={`${node.title} — ${node.status.toLowerCase()}`}
                className={`flex items-center justify-center rounded-full ring-2 transition-transform ${style.ring} ${style.fill} ${
                  isInteractive ? 'hover:scale-105 cursor-pointer' : 'cursor-not-allowed opacity-90'
                }`}
                style={{ width: NODE_RADIUS * 2, height: NODE_RADIUS * 2 }}
              >
                {style.icon === 'lock' && <Lock className="h-5 w-5" aria-hidden="true" />}
                {style.icon === 'check' && <Check className="h-6 w-6" aria-hidden="true" />}
                {style.icon === null && <span className="font-title text-sm">{index + 1}</span>}
              </button>
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

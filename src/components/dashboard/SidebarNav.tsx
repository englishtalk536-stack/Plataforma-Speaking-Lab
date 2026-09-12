'use client';

import { Home, MessageCircle, GitBranch, Trophy, ShoppingBag } from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
  { id: 'home', label: 'Dashboard', icon: Home },
  { id: 'practice', label: 'AI Practice', icon: MessageCircle },
  { id: 'skills', label: 'Skill Path', icon: GitBranch },
  { id: 'badges', label: 'Badges', icon: Trophy },
  { id: 'store', label: 'Store', icon: ShoppingBag },
] as const;

/** Dark icon-rail navigation — a HUD-like control column rather than a text-heavy sidebar. */
export function SidebarNav() {
  const [active, setActive] = useState<(typeof NAV_ITEMS)[number]['id']>('home');

  return (
    <nav
      aria-label="Main"
      className="flex w-16 shrink-0 flex-col items-center gap-2 rounded-2xl bg-speaking-cobalt py-4"
    >
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => setActive(id)}
            className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
              isActive ? 'bg-speaking-mustard text-speaking-cobalt' : 'text-speaking-white/70 hover:bg-speaking-king/60'
            }`}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </button>
        );
      })}
    </nav>
  );
}

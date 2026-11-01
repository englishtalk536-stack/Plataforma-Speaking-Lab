'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { MessagesSquare } from 'lucide-react';
import vectorizedLogo from '../../docs/Logo vectorizado.png';

export function TeacherSidebarNav({ active }: { active: 'classrooms' | 'history' | 'messages' | 'help' }) {
  const router = useRouter();

  async function handleSignOut() {
    await signOut({ redirect: false, callbackUrl: '/login' });
    router.replace('/login');
    router.refresh();
  }

  return (
    <aside className="flex shrink-0 flex-col border-b border-white/10 bg-gradient-to-b from-speaking-cobalt via-speaking-cobalt to-[#173761] px-5 py-4 text-white shadow-[0_12px_30px_rgba(19,39,67,0.12)] md:sticky md:top-0 md:min-h-screen md:w-64 md:px-5 md:py-7">
      <Link href="/teacher" aria-label="Speaking Lab, ir a Aulas" className="inline-flex w-fit items-center gap-2 font-title text-lg text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-mustard">
        <Image src={vectorizedLogo} alt="" aria-hidden="true" className="h-9 w-9 shrink-0 object-contain" />
        <span><span className="text-speaking-mustard">Speaking</span>{' '}Lab</span>
      </Link>
      <nav aria-label="Navegación docente" className="mt-4 flex gap-2 md:mt-10 md:flex-1 md:flex-col">
        <Link
          href="/teacher"
          aria-current={active === 'classrooms' ? 'page' : undefined}
          className={`flex min-h-11 items-center rounded-xl border px-3 font-body text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-mustard ${
            active === 'classrooms'
              ? 'border-speaking-mustard/50 bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
              : 'border-transparent text-white/75 hover:border-white/15 hover:bg-white/5 hover:text-white'
          }`}
        >
          Aulas
        </Link>
        <Link
          href="/teacher/history"
          aria-current={active === 'history' ? 'page' : undefined}
          className={`flex min-h-11 items-center rounded-xl border px-3 font-body text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-mustard ${
            active === 'history'
              ? 'border-speaking-mustard/50 bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
              : 'border-transparent text-white/75 hover:border-white/15 hover:bg-white/5 hover:text-white'
          }`}
        >
          Historial
        </Link>
        <Link
          href="/teacher/messages"
          aria-current={active === 'messages' ? 'page' : undefined}
          className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 font-body text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-mustard ${
            active === 'messages'
              ? 'border-speaking-mustard/50 bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
              : 'border-transparent text-white/75 hover:border-white/15 hover:bg-white/5 hover:text-white'
          }`}
        >
          <MessagesSquare className="h-4 w-4" aria-hidden="true" />
          Mensajes
        </Link>
        <Link
          href="/help/teacher"
          aria-current={active === 'help' ? 'page' : undefined}
          className={`flex min-h-11 items-center rounded-xl border px-3 font-body text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-mustard ${
            active === 'help'
              ? 'border-speaking-mustard/50 bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
              : 'border-transparent text-white/75 hover:border-white/15 hover:bg-white/5 hover:text-white'
          }`}
        >
          Guía del profesor
        </Link>
      </nav>
      <button
        type="button"
        onClick={() => void handleSignOut()}
        className="mt-3 inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-white/20 px-3 font-body text-sm font-semibold text-white/85 transition-colors hover:border-white/35 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-mustard focus-visible:outline-offset-2 md:mt-auto md:justify-start"
      >
        Cerrar sesión
      </button>
    </aside>
  );
}
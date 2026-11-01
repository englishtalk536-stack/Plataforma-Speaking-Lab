'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { BookOpenCheck, History, MessagesSquare } from 'lucide-react';
import vectorizedLogo from '../../docs/Logo vectorizado.png';

export function StudentSidebarNav({ active }: { active: 'dashboard' | 'history' | 'messages' | 'help' }) {
  const router = useRouter();

  async function handleSignOut() {
    await signOut({ redirect: false, callbackUrl: '/login' });
    router.replace('/login');
    router.refresh();
  }

  return (
    <aside className="border-b border-white/10 bg-gradient-to-b from-speaking-cobalt via-speaking-cobalt to-[#173761] px-4 py-3 text-white shadow-[0_12px_30px_rgba(19,39,67,0.12)] md:sticky md:top-0 md:flex md:h-screen md:w-60 md:shrink-0 md:flex-col md:px-5 md:py-6">
      <Link href="/" aria-label="Speaking Lab, ir a Mi panel" className="inline-flex w-fit items-center gap-2 font-title text-lg text-white transition-opacity duration-200 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-mustard">
        <Image src={vectorizedLogo} alt="" aria-hidden="true" className="h-9 w-9 shrink-0 object-contain" />
        <span><span className="text-speaking-mustard">Speaking</span>{' '}Lab</span>
      </Link>
      <nav aria-label="Navegación del estudiante" className="mt-3 flex gap-2 overflow-x-auto md:mt-10 md:flex-1 md:flex-col">
        <Link
          href="/"
          aria-current={active === 'dashboard' ? 'page' : undefined}
          className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border px-3 font-body text-sm font-semibold transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-mustard ${
            active === 'dashboard'
              ? 'border-speaking-mustard/45 bg-speaking-mustard/12 text-white shadow-[inset_3px_0_0_#EAB135,0_5px_18px_rgba(0,0,0,0.10)]'
              : 'border-transparent text-white/75 hover:border-white/15 hover:bg-white/8 hover:text-white'
          }`}
        >
          <BookOpenCheck className="h-4 w-4" aria-hidden="true" />
          Mi panel
        </Link>
        <Link
          href="/student/history"
          aria-current={active === 'history' ? 'page' : undefined}
          className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border px-3 font-body text-sm font-semibold transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-mustard ${
            active === 'history'
              ? 'border-speaking-mustard/45 bg-speaking-mustard/12 text-white shadow-[inset_3px_0_0_#EAB135,0_5px_18px_rgba(0,0,0,0.10)]'
              : 'border-transparent text-white/75 hover:border-white/15 hover:bg-white/8 hover:text-white'
          }`}
        >
          <History className="h-4 w-4" aria-hidden="true" />
          Historial
        </Link>
        <Link
          href="/student/messages"
          aria-current={active === 'messages' ? 'page' : undefined}
          className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border px-3 font-body text-sm font-semibold transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-mustard ${
            active === 'messages'
              ? 'border-speaking-mustard/45 bg-speaking-mustard/12 text-white shadow-[inset_3px_0_0_#EAB135,0_5px_18px_rgba(0,0,0,0.10)]'
              : 'border-transparent text-white/75 hover:border-white/15 hover:bg-white/8 hover:text-white'
          }`}
        >
          <MessagesSquare className="h-4 w-4" aria-hidden="true" />
          Mensajes
        </Link>
        <Link
          href="/help/student"
          aria-current={active === 'help' ? 'page' : undefined}
          className={`inline-flex min-h-11 shrink-0 items-center rounded-xl border px-3 font-body text-sm font-semibold transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-mustard ${
            active === 'help'
              ? 'border-speaking-mustard/45 bg-speaking-mustard/12 text-white shadow-[inset_3px_0_0_#EAB135,0_5px_18px_rgba(0,0,0,0.10)]'
              : 'border-transparent text-white/75 hover:border-white/15 hover:bg-white/8 hover:text-white'
          }`}
        >
          Guía del estudiante
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
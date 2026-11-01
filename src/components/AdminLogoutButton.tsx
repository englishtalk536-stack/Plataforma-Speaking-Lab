'use client';

import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

export function AdminLogoutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await signOut({ redirect: false, callbackUrl: '/login' });
    router.replace('/login');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={() => void handleSignOut()}
      className="mt-4 inline-flex min-h-11 items-center justify-center border border-speaking-cobalt/20 px-4 font-body text-sm font-semibold text-speaking-cobalt transition-colors hover:bg-speaking-cobalt/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-cobalt focus-visible:outline-offset-2 sm:mt-0"
    >
      Cerrar sesión
    </button>
  );
}
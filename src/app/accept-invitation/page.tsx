'use client';

import Link from 'next/link';
import { useState, useSyncExternalStore, type FormEvent } from 'react';
import { AuthShell } from '../../components/auth/AuthShell';

function subscribeToInvitationToken(onChange: () => void) {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

function getInvitationToken() {
  return window.location.hash.slice(1);
}

function getServerInvitationToken() {
  return '';
}

export default function AcceptInvitationPage() {
  const token = useSyncExternalStore(subscribeToInvitationToken, getInvitationToken, getServerInvitationToken);
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || pending) return;
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch('/api/auth/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const body = await response.json() as { error?: string; role?: string };
      if (!response.ok) {
        setMessage({ ok: false, text: body.error ?? 'No se pudo aceptar la invitación.' });
        return;
      }
      setPassword('');
      setAccepted(true);
      window.history.replaceState(null, '', window.location.pathname);
      setMessage({ ok: true, text: `Cuenta creada como ${body.role === 'TEACHER' ? 'profesor' : 'estudiante'}. Ya puedes iniciar sesión.` });
    } catch {
      setMessage({ ok: false, text: 'No se pudo conectar. Inténtalo de nuevo.' });
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell>
      <p className="font-body text-xs font-bold uppercase text-speaking-king">Invitación a Speaking Lab</p>
      <h1 className="mt-2 font-title text-3xl text-speaking-cobalt">Crear cuenta</h1>
      <p className="mt-2 font-body text-sm leading-6 text-speaking-cobalt/65">Elige una contraseña para aceptar la invitación. El rol y, si corresponde, el aula vienen definidos por el administrador.</p>
      <form onSubmit={submit} className="mt-7 space-y-4">
        <div>
          <label htmlFor="invitation-password" className="block font-body text-sm font-semibold text-speaking-cobalt">Contraseña nueva</label>
          <input id="invitation-password" type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 min-h-12 w-full border border-speaking-cobalt/20 bg-white px-3.5 font-body text-sm text-speaking-cobalt" />
        </div>
        {message && <p role={message.ok ? 'status' : 'alert'} className={`font-body text-sm ${message.ok ? 'text-speaking-success' : 'text-speaking-streak'}`}>{message.text}</p>}
        {accepted ? (
          <Link href="/login" className="inline-flex min-h-11 items-center justify-center bg-speaking-cobalt px-4 font-body text-sm font-semibold text-white">Ir a iniciar sesión</Link>
        ) : (
          <button type="submit" disabled={pending || !token} className="min-h-12 w-full bg-speaking-cobalt px-5 py-3 font-body text-sm font-bold text-white disabled:opacity-60">
            {pending ? 'Aceptando…' : token ? 'Aceptar invitación' : 'Abre el enlace completo de invitación'}
          </button>
        )}
      </form>
    </AuthShell>
  );
}
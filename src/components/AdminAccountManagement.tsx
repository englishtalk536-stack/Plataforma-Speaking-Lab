'use client';

import { useState, type FormEvent } from 'react';
import { createAccountInvitation, type AccountInvitationResult } from '../lib/account-invitation-actions';

type ClassroomOption = { id: string; name: string; teacherName: string };
type InvitationSummary = {
  id: string;
  email: string;
  fullName: string;
  role: 'STUDENT' | 'TEACHER';
  classroomName: string | null;
  expiresAt: string;
  status: 'accepted' | 'expired' | 'pending';
};

function InvitationForm({
  role,
  classrooms,
}: {
  role: 'STUDENT' | 'TEACHER';
  classrooms: ClassroomOption[];
}) {
  const [result, setResult] = useState<AccountInvitationResult | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setResult(null);
    const form = event.currentTarget;
    try {
      const invitation = await createAccountInvitation(role, new FormData(form));
      setResult(invitation);
      if (invitation.ok) form.reset();
    } catch {
      setResult({ ok: false, message: 'No se pudo crear la invitación. Comprueba tus permisos e inténtalo de nuevo.' });
    } finally {
      setPending(false);
    }
  }

  const invitationUrl = result?.ok && typeof window !== 'undefined'
    ? `${window.location.origin}/accept-invitation#${result.token}`
    : null;

  return (
    <form onSubmit={submit} className="space-y-3 border-t border-speaking-cobalt/10 pt-4 first:border-0 first:pt-0">
      <h3 className="font-body text-sm font-semibold text-speaking-cobalt">
        {role === 'TEACHER' ? 'Invitar profesor' : 'Invitar estudiante'}
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block font-body text-sm font-semibold text-speaking-cobalt" htmlFor={`invite-name-${role}`}>Nombre</label>
          <input id={`invite-name-${role}`} name="fullName" required minLength={2} maxLength={120} autoComplete="name" className="mt-1 min-h-11 w-full border border-speaking-cobalt/20 bg-white px-3 font-body text-sm text-speaking-cobalt" />
        </div>
        <div>
          <label className="block font-body text-sm font-semibold text-speaking-cobalt" htmlFor={`invite-email-${role}`}>Correo electrónico</label>
          <input id={`invite-email-${role}`} name="email" type="email" required maxLength={254} autoComplete="email" className="mt-1 min-h-11 w-full border border-speaking-cobalt/20 bg-white px-3 font-body text-sm text-speaking-cobalt" />
        </div>
        {role === 'STUDENT' && (
          <div className="sm:col-span-2">
            <label className="block font-body text-sm font-semibold text-speaking-cobalt" htmlFor="invite-classroom">Aula (opcional)</label>
            <select id="invite-classroom" name="classroomId" defaultValue="" className="mt-1 min-h-11 w-full border border-speaking-cobalt/20 bg-white px-3 font-body text-sm text-speaking-cobalt">
              <option value="">Sin asignar</option>
              {classrooms.map((classroom) => <option key={classroom.id} value={classroom.id}>{classroom.name} · {classroom.teacherName}</option>)}
            </select>
          </div>
        )}
      </div>
      {result && !result.ok && <p role="alert" className="font-body text-sm text-speaking-streak">{result.message}</p>}
      {result?.ok && invitationUrl && (
        <div role="status" className="space-y-2 border-l-2 border-speaking-success bg-speaking-success/5 p-3">
          <p className="font-body text-sm font-semibold text-speaking-success">Invitación lista. Expira {new Date(result.expiresAt).toLocaleString('es-ES')}.</p>
          <p className="font-body text-xs text-speaking-cobalt/70">Enlace de un solo uso; cópialo y compártelo ahora. No se envió ningún correo.</p>
          <a href={invitationUrl} className="block break-all font-body text-sm text-speaking-cobalt underline">{invitationUrl}</a>
          <button type="button" onClick={() => setResult(null)} className="min-h-10 border border-speaking-cobalt/20 px-3 font-body text-xs font-semibold text-speaking-cobalt">Ocultar enlace</button>
        </div>
      )}
      <button type="submit" disabled={pending} className="inline-flex min-h-11 items-center justify-center bg-speaking-cobalt px-4 font-body text-sm font-semibold text-white hover:bg-speaking-cobalt/90 disabled:cursor-not-allowed disabled:opacity-60">
        {pending ? 'Creando…' : 'Generar invitación'}
      </button>
    </form>
  );
}

export function AdminAccountManagement({
  classrooms,
  invitations,
}: {
  classrooms: ClassroomOption[];
  invitations: InvitationSummary[];
}) {
  return (
    <>
    <section id="admin-invitations" className="scroll-mt-6 space-y-5 rounded-2xl border border-speaking-cobalt/10 bg-white p-5 shadow-[0_6px_24px_rgba(16,52,105,0.05)] sm:p-6" aria-labelledby="manage-accounts-heading">
      <div>
        <p className="font-body text-xs font-bold uppercase tracking-[0.1em] text-speaking-king">Acceso seguro</p>
        <h2 id="manage-accounts-heading" className="mt-1 font-title text-2xl text-speaking-cobalt">Invitaciones</h2>
        <p className="mt-2 max-w-3xl font-body text-sm leading-6 text-speaking-cobalt/75">Invita profesores y estudiantes con su rol definido. Cada enlace se usa una vez y caduca en siete días; no se envía correo.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-speaking-cobalt/10 bg-speaking-white p-4 sm:p-5"><InvitationForm role="TEACHER" classrooms={classrooms} /></div>
        <div className="rounded-xl border border-speaking-cobalt/10 bg-speaking-white p-4 sm:p-5"><InvitationForm role="STUDENT" classrooms={classrooms} /></div>
      </div>
      <div className="border-t border-speaking-cobalt/10 pt-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-title text-lg text-speaking-cobalt">Invitaciones recientes</h3>
          <span className="font-body text-xs text-speaking-cobalt/60">Últimas {invitations.length}</span>
        </div>
        {invitations.length === 0 ? (
          <p className="mt-2 font-body text-sm text-speaking-cobalt/70">Todavía no hay invitaciones.</p>
        ) : (
          <ul className="mt-2 divide-y divide-speaking-cobalt/10">
            {invitations.map((invitation) => {
              const statusLabel = invitation.status === 'accepted' ? 'Aceptada' : invitation.status === 'expired' ? 'Expirada' : 'Pendiente';
              return (
                <li key={invitation.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-body text-sm font-semibold text-speaking-cobalt">{invitation.fullName} · {invitation.email}</p>
                    <p className="font-body text-sm text-speaking-cobalt/70">{invitation.role === 'TEACHER' ? 'Profesor' : `Estudiante · ${invitation.classroomName ?? 'Sin aula asignada'}`}</p>
                  </div>
                  <p className="font-body text-sm text-speaking-cobalt/70">{statusLabel} · vence {new Date(invitation.expiresAt).toLocaleDateString('es-ES')}</p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
    </>
  );
}
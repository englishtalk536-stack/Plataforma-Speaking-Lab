'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    const response = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      setError(body?.error ?? 'Unable to create your account.');
    } else {
      await signIn('credentials', { email: form.email, password: form.password, callbackUrl: '/' });
    }
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-speaking-white px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-speaking-cobalt/10 bg-speaking-cobalt p-8 shadow-xl">
        <p className="font-title text-sm uppercase tracking-wide text-speaking-mustard">SpeakingLab</p>
        <h1 className="mt-3 font-title text-3xl text-speaking-white">Start your path</h1>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <label className="block font-body text-sm text-speaking-white">Full name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 w-full rounded-xl border-0 px-3 py-2.5 text-speaking-cobalt" /></label>
          <label className="block font-body text-sm text-speaking-white">Email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-1 w-full rounded-xl border-0 px-3 py-2.5 text-speaking-cobalt" /></label>
          <label className="block font-body text-sm text-speaking-white">Password<input required minLength={8} type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="mt-1 w-full rounded-xl border-0 px-3 py-2.5 text-speaking-cobalt" /></label>
          {error && <p role="alert" className="font-body text-sm text-speaking-streak">{error}</p>}
          <button disabled={loading} className="w-full rounded-full bg-speaking-mustard py-3 font-body font-semibold text-speaking-cobalt disabled:opacity-60">{loading ? 'Creating account…' : 'Create account'}</button>
        </form>
        <p className="mt-6 text-center font-body text-sm text-speaking-white/70">Already registered? <Link href="/login" className="text-speaking-mustard">Sign in</Link></p>
      </section>
    </main>
  );
}

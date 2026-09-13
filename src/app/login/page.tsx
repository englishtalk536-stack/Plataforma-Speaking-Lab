'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    const result = await signIn('credentials', { email, password, redirect: false, callbackUrl: '/' });
    if (result?.error) setError('Correo o contraseña incorrectos.');
    else router.push('/');
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-speaking-white px-4 py-10">
      <section className="w-full max-w-md rounded-2xl bg-speaking-cobalt p-8 shadow-xl">
        <p className="font-title text-sm uppercase tracking-wide text-speaking-mustard">SpeakingLab</p>
        <h1 className="mt-3 font-title text-3xl text-speaking-white">Welcome back</h1>
        <p className="mt-2 font-body text-sm text-speaking-white/70">Sign in to continue your learning path.</p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <label className="block font-body text-sm text-speaking-white">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-xl border-0 px-3 py-2.5 text-speaking-cobalt" /></label>
          <label className="block font-body text-sm text-speaking-white">Password<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-xl border-0 px-3 py-2.5 text-speaking-cobalt" /></label>
          {error && <p role="alert" className="font-body text-sm text-speaking-streak">{error}</p>}
          <button disabled={loading} className="w-full rounded-full bg-speaking-mustard py-3 font-body font-semibold text-speaking-cobalt disabled:opacity-60">{loading ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <button type="button" onClick={() => void signIn('google', { callbackUrl: '/' })} className="mt-3 w-full rounded-full border border-speaking-white/30 py-3 font-body text-sm text-speaking-white">Continue with Google</button>
        <p className="mt-6 text-center font-body text-sm text-speaking-white/70">New here? <Link href="/register" className="text-speaking-mustard">Create an account</Link></p>
      </section>
    </main>
  );
}

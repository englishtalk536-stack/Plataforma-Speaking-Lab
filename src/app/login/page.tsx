'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { AuthShell } from '../../components/auth/AuthShell';

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
    <AuthShell>
      <p className="font-body text-xs font-bold uppercase text-speaking-king">Tu espacio de aprendizaje</p>
      <h1 className="mt-2 font-title text-3xl text-speaking-cobalt">Iniciar sesión</h1>
      <p className="mt-2 font-body text-sm leading-6 text-speaking-cobalt/65">
        Entra para continuar tu recorrido de inglés.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="login-email" className="block font-body text-sm font-semibold text-speaking-cobalt">
            Correo electrónico
          </label>
          <input
            id="login-email"
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 h-12 w-full border border-speaking-cobalt/20 bg-white px-3.5 font-body text-sm text-speaking-cobalt outline-none transition focus:border-speaking-king focus:ring-2 focus:ring-speaking-king/15"
          />
        </div>

        <div>
          <label htmlFor="login-password" className="block font-body text-sm font-semibold text-speaking-cobalt">
            Contraseña
          </label>
          <input
            id="login-password"
            required
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 h-12 w-full border border-speaking-cobalt/20 bg-white px-3.5 font-body text-sm text-speaking-cobalt outline-none transition focus:border-speaking-king focus:ring-2 focus:ring-speaking-king/15"
          />
        </div>

        {error && (
          <p role="alert" className="border-l-2 border-speaking-streak bg-speaking-streak/5 px-3 py-2 font-body text-sm text-speaking-streak">
            {error}
          </p>
        )}

        <button
          disabled={loading}
          className="min-h-12 w-full bg-speaking-mustard px-5 py-3 font-body text-sm font-bold text-speaking-cobalt shadow-sm transition-colors hover:bg-speaking-mustard/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-cobalt focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-65"
        >
          {loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
        </button>
      </form>

      <button
        type="button"
        disabled={loading}
        onClick={() => void signIn('google', { callbackUrl: '/' })}
        className="mt-3 min-h-12 w-full border border-speaking-cobalt/35 bg-white px-5 py-3 font-body text-sm font-semibold text-speaking-cobalt transition-colors hover:bg-speaking-cobalt/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-cobalt focus-visible:outline-offset-2 disabled:opacity-60"
      >
        Continuar con Google
      </button>

      <p className="mt-6 text-center font-body text-sm leading-6 text-speaking-cobalt/70">
        El acceso se habilita mediante una invitación de Speaking Lab. Solicita un enlace a tu profesor o administrador.
      </p>
    </AuthShell>
  );
}

import Link from 'next/link';

export default function StudentAccessPausedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-speaking-white px-4 py-10">
      <section className="w-full max-w-lg border border-speaking-cobalt/15 bg-white p-6 shadow-sm sm:p-8">
        <p className="font-body text-xs font-semibold uppercase text-speaking-streak">Acceso pausado</p>
        <h1 className="mt-2 font-title text-2xl text-speaking-cobalt">Tu acceso a Speaking Lab está pausado</h1>
        <p className="mt-3 font-body text-sm leading-6 text-speaking-cobalt/70">
          Contacta a tu profesor o al administrador para revisar el estado de tu mensualidad y reactivar tu acceso.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex min-h-11 items-center border border-speaking-cobalt/25 px-4 py-2 font-body text-sm font-semibold text-speaking-cobalt hover:bg-speaking-cobalt/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-cobalt focus-visible:outline-offset-2"
        >
          Volver al inicio de sesión
        </Link>
      </section>
    </main>
  );
}

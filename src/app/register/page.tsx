import Link from 'next/link';
import { AuthShell } from '../../components/auth/AuthShell';

export default function RegisterPage() {
  return (
    <AuthShell>
      <p className="font-body text-xs font-bold uppercase text-speaking-king">Acceso por invitación</p>
      <h1 className="mt-2 font-title text-3xl text-speaking-cobalt">Necesitas una invitación</h1>
      <p className="mt-3 font-body text-sm leading-6 text-speaking-cobalt/75">
        Para crear tu cuenta, abre el enlace personal de un solo uso que te compartió un administrador de Speaking Lab. El rol y el aula, si corresponde, ya vienen definidos en esa invitación.
      </p>
      <Link href="/login" className="mt-6 inline-flex min-h-12 w-full items-center justify-center bg-speaking-cobalt px-5 py-3 font-body text-sm font-bold text-white transition-colors hover:bg-speaking-king focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-cobalt focus-visible:outline-offset-2">
        Ir a iniciar sesión
      </Link>
    </AuthShell>
  );
}

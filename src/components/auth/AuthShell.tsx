import Image from 'next/image';
import type { ReactNode } from 'react';
import speakingLabLogo from '../../../public/speaking-lab-logo.png';

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#f4f7fb] px-4 py-6 text-speaking-cobalt sm:px-8 sm:py-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -right-28 -top-32 h-[34rem] w-[34rem] rounded-full bg-white/80 blur-3xl" />
        <div className="absolute -bottom-48 -left-40 h-[30rem] w-[30rem] rounded-full bg-[#dceaf5]/75 blur-3xl" />
        <div className="absolute right-[7%] top-[13%] h-56 w-56 rounded-full border border-speaking-cobalt/5" />
        <div className="absolute bottom-[9%] left-[7%] h-40 w-40 rounded-full border border-speaking-cobalt/5" />
      </div>

      <section className="grid w-full max-w-6xl overflow-hidden border border-white/90 bg-white/75 shadow-[0_24px_80px_rgba(16,52,105,0.12)] backdrop-blur-xl md:min-h-[min(760px,calc(100vh-4rem))] md:grid-cols-[1.05fr_0.95fr]">
        <div className="relative flex min-h-[260px] items-center justify-center overflow-hidden bg-[#eef4f8] px-6 py-8 sm:min-h-[320px] sm:px-10 md:min-h-full md:px-10 lg:px-14">
          <div aria-hidden="true" className="absolute inset-0 opacity-75">
            <div className="absolute -left-10 top-8 h-40 w-40 rotate-[-18deg] bg-speaking-mustard/25 [clip-path:polygon(50%_0,100%_25%,78%_100%,8%_76%)]" />
            <div className="absolute -right-10 -top-12 h-64 w-64 rotate-[14deg] bg-[#75cce0]/30 [clip-path:polygon(0_14%,76%_0,100%_44%,60%_100%,14%_79%)]" />
            <div className="absolute -bottom-16 left-[14%] h-52 w-52 rotate-[12deg] bg-[#e89ab9]/25 [clip-path:polygon(8%_0,100%_22%,83%_100%,0_72%)]" />
            <div className="absolute bottom-7 right-[8%] h-36 w-36 rotate-[-12deg] bg-[#92cba0]/30 [clip-path:polygon(50%_0,100%_42%,63%_100%,0_78%,12%_18%)]" />
            <div className="absolute left-[5%] top-[49%] h-16 w-16 rotate-12 bg-[#ed7540]/45 [clip-path:polygon(50%_0,100%_100%,0_72%)]" />
            <div className="absolute right-[21%] top-[15%] h-14 w-14 rotate-[-8deg] bg-speaking-king/25 [clip-path:polygon(50%_0,100%_30%,82%_100%,12%_78%,0_22%)]" />
            <span className="absolute left-[15%] top-[18%] h-2.5 w-2.5 rounded-full bg-speaking-cobalt/45" />
            <span className="absolute bottom-[20%] right-[19%] h-3 w-3 rounded-full bg-speaking-mustard" />
          </div>

          <div className="relative z-10 flex w-full max-w-md flex-col items-center text-center md:items-start md:text-left">
            <div className="relative mb-5 flex h-32 w-32 items-center justify-center sm:mb-7 sm:h-40 sm:w-40">
              <div className="absolute inset-0 rotate-[-8deg] rounded-[2rem] border border-white/90 bg-white/65 shadow-[0_14px_36px_rgba(16,52,105,0.12)] backdrop-blur-md" />
              <Image
                src={speakingLabLogo}
                alt="Logo de Speaking Lab"
                width={160}
                height={160}
                priority
                className="relative h-[112px] w-[112px] object-contain sm:h-[144px] sm:w-[144px]"
              />
            </div>
            <p className="font-body text-xs font-bold uppercase text-speaking-king">Speaking Lab</p>
            <h2 className="mt-3 max-w-lg font-title text-3xl leading-tight text-speaking-cobalt sm:text-4xl">
              Bienvenidos a Speaking Lab. Enciende tu voz.
            </h2>
            <p className="mt-4 max-w-md font-body text-lg leading-7 text-speaking-cobalt/75 sm:text-xl">
              ¡Tu camino hacia la fluidez comienza aquí!
            </p>
            <div className="mt-6 hidden items-center gap-2 font-body text-xs font-semibold text-speaking-cobalt/65 md:flex">
              <span className="h-2 w-2 rounded-full bg-speaking-mustard" />
              Escucha, practica y avanza a tu ritmo
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center bg-white px-6 py-9 sm:px-12 sm:py-12 lg:px-14">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </section>

      <div aria-hidden="true" className="pointer-events-none absolute right-[5%] top-[48%] hidden h-8 w-8 rotate-12 bg-speaking-king/75 [clip-path:polygon(50%_0,100%_100%,0_75%)] lg:block" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-[13%] right-[12%] hidden h-7 w-7 rotate-[-10deg] bg-[#d34045]/75 [clip-path:polygon(0_0,100%_25%,70%_100%)] lg:block" />
    </main>
  );
}

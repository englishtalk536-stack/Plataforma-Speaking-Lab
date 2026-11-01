import Link from 'next/link';
import { ArrowLeft, BookOpenCheck, CircleHelp } from 'lucide-react';

type GuideStep = { title: string; body: string; see?: string; unavailable?: boolean };
type GuideSection = { id: string; title: string; steps: GuideStep[] };
type GuideContent = { audience: 'student' | 'teacher'; title: string; description: string; sections: GuideSection[]; problems: string[] };

const studentGuide: GuideContent = {
  audience: 'student',
  title: 'Guía del estudiante',
  description: 'Recorre tu aula, entrega actividades y consulta el seguimiento de tus profesores.',
  sections: [
    { id: 'student-access', title: 'Acceso y panel', steps: [
      { title: 'Inicia sesión y navega el panel', body: 'Abre Speaking Lab e inicia sesión con tu propia cuenta. Cada estudiante tiene una cuenta individual; el aula es el grupo al que te asigna el administrador. Usa “Mi panel” para volver al dashboard, “Historial” para consultar lo registrado y “Mensajes” para escribir a un profesor de tu aula activa.', see: 'Tu panel muestra tu nombre, progreso, aulas y accesos a “Historial” y “Mensajes”.' },
    ] },
    { id: 'student-classroom', title: 'Aula y clases', steps: [
      { title: 'Abre tu aula y revisa el nivel', body: 'En el panel, selecciona la tarjeta del aula para entrar. El nivel que aparece bajo “Tu nivel de inglés” corresponde a esa matrícula; si falta, el profesor puede asignarlo.', see: 'Verás el nombre del aula, tu nivel y las secciones disponibles para esa aula.' },
      { title: 'Consulta la próxima clase', body: 'En “Próximas clases” revisa el título y la fecha/hora. Pulsa “Abrir clase” para abrir el enlace externo en otra pestaña.', see: 'Las clases futuras aparecen con el estado “Programada”.' },
      { title: 'Lee tareas y seguimiento', body: 'En “Seguimiento activo” consulta apuntes, “Oportunidades de mejora”, “Tareas” y prácticas compartidas por el profesor. Las tareas de texto no tienen control de entrega ni estado de completado; permanecen como información pendiente. En “Actividades y tareas” encontrarás actividades escritas que todavía no has entregado.' },
    ] },
    { id: 'student-activities', title: 'Actividades y resultados', steps: [
      { title: 'Responde una actividad escrita', body: 'Abre tu aula, lee la “Consigna”, escribe en “Tu respuesta” y pulsa “Enviar actividad”. La entrega queda cerrada después del primer envío.' , see: 'La respuesta queda guardada y la actividad aparece en “Historial del estudiante”.' },
      { title: 'Revisa entrega, nota y feedback', body: 'Abre “Historial”. Cada entrega aparece como “Entregada” hasta que el profesor la califique. Después verás “Calificada” y, si se registraron, la nota sobre 20 y el comentario de feedback.' },
      { title: 'Cambiar una entrega', body: 'No está disponible editar una respuesta después de enviarla. La plataforma no ofrece un control para reemplazarla ni retirar feedback previo; contacta al profesor mediante “Mensajes” si necesitas aclarar algo.', unavailable: true },
      { title: 'Consulta el historial', body: 'Pulsa “Historial” desde el panel o desde el aula. Allí se muestran clases completadas, actividades escritas, misiones y prácticas registradas para tu cuenta.' },
    ] },
    { id: 'student-progress', title: 'Progreso y salida', steps: [
      { title: 'Consulta XP y racha', body: 'El panel muestra tus XP, nivel de progreso y días de racha. La guía no atribuye reglas de cálculo: sólo refleja los valores que presenta el sistema.' , see: 'Encontrarás los valores en el encabezado y los indicadores del dashboard.' },
      { title: 'Cierra sesión', body: 'Usa “Cerrar sesión” al terminar; está al final del menú de navegación.' },
    ] },
  ],
  problems: [
    'Si un aula no aparece o no puedes abrirla, comprueba que hayas iniciado sesión con tu cuenta de estudiante y solicita al administrador que revise tu asignación o matrícula.',
    'Si la actividad ya dice “Entregada”, no se puede editar desde la plataforma. Escribe al profesor desde “Mensajes”.',
    'Si el enlace de una clase no abre, confirma que la sesión esté programada y consulta al profesor para verificar el enlace externo.',
  ],
};

const teacherGuide: GuideContent = {
  audience: 'teacher',
  title: 'Guía del profesor',
  description: 'Administra tus aulas, acompaña el progreso y organiza clases y actividades.',
  sections: [
    { id: 'teacher-access', title: 'Acceso y panel', steps: [
      { title: 'Inicia sesión y navega el panel', body: 'Entra con tu cuenta de profesor. La cuenta identifica tu acceso; las aulas son grupos separados asignados a tu perfil. Usa “Aulas” para volver a tus grupos, “Historial” para clases dictadas y actividades calificadas, y “Mensajes” para conversaciones individuales con estudiantes de tus aulas activas.', see: 'El panel del profesor muestra acciones pendientes, agenda, métricas y aulas activas.' },
    ] },
    { id: 'teacher-classrooms', title: 'Aulas y estudiantes', steps: [
      { title: 'Abre y gestiona un aula', body: 'En el panel pulsa “Gestionar aulas” para ir a “Aulas activas”; en la tarjeta del grupo pulsa “Abrir aula”. Desde allí puedes asignar misiones o prácticas al grupo y entrar al detalle de cada estudiante.', see: 'En el aula verás “Asignar al grupo”, “Clases virtuales”, “Seguimiento pedagógico”, “Actividades escritas” y “Gestionar estudiantes”.' },
      { title: 'Invitaciones y gestión de estudiantes', body: 'Puedes gestionar estudiantes ya asociados al aula, abrir su progreso, cambiar su nivel y enviarles un mensaje. Crear/invitar cuentas y asignar estudiantes nuevos no está disponible en el panel del profesor; esas altas se gestionan desde Administración.', unavailable: true },
    ] },
    { id: 'teacher-classes', title: 'Clases y seguimiento', steps: [
      { title: 'Programa una clase virtual', body: 'En “Clases virtuales”, baja a “Programar clase virtual”, completa “Título”, “Fecha y hora” y “Enlace externo HTTPS”, y pulsa “Programar clase”.', see: 'La clase programada aparece en el aula y en la agenda del panel.' },
      { title: 'Márcala como dictada', body: 'Cuando llegue la fecha y hora programadas, abre el aula y pulsa “Marcar como clase dictada”. El control permanece deshabilitado antes de la hora prevista.' },
      { title: 'Registra la asistencia', body: 'Después de marcarla como dictada, abre “Historial” y localiza la clase. En “Asistencia”, usa “Asistió” o “Ausente” para cada estudiante.' },
      { title: 'Guarda el seguimiento', body: 'En el aula abre el formulario “Registrar una clase dictada”. Elige destinatarios (“Todo el grupo” o “Elegir estudiantes”), completa “Título de la clase”, fecha y los campos “Apuntes de la clase”, “Oportunidades de mejora” y “Tareas”. Si corresponde, selecciona una “Práctica del currículo” y pulsa “Guardar y compartir”.' },
    ] },
    { id: 'teacher-activities', title: 'Actividades y resultados', steps: [
      { title: 'Crea una actividad escrita', body: 'En “Actividades escritas”, completa “Título” y “Consigna”; se comparte con estudiantes activos de esa aula. Pulsa “Crear actividad”. No tiene fecha límite.', see: 'Las actividades pendientes de revisión y las actividades activas aparecen en secciones separadas.' },
      { title: 'Revisa y califica entregas', body: 'En “Entregas pendientes de calificar”, abre la respuesta, asigna una calificación de 1 a 20, escribe “Feedback para el estudiante” y pulsa “Guardar nota”. Una actividad aparece completada en el historial cuando las entregas requeridas están calificadas.' },
      { title: 'Consulta el historial', body: 'Pulsa “Historial” desde el panel o el aula. En “Historial docente” puedes filtrar por “Aula” y “Estudiante”; aparecen clases dictadas, actividades calificadas y misiones completadas.' },
    ] },
    { id: 'teacher-level', title: 'Nivel y salida', steps: [
      { title: 'Actualiza el nivel individual', body: 'En “Gestionar estudiantes”, abre el estudiante y pulsa “Actualizar nivel”. Selecciona “Nuevo nivel” (A1, A2, B1, B2, C1 o C2); puedes anotar un “Motivo del cambio” y pulsar “Guardar nivel”. El nivel se aplica sólo a esa matrícula.', see: 'Los cambios quedan registrados en “Cambios recientes”.' },
      { title: 'Cierra sesión', body: 'Pulsa “Cerrar sesión” al final del menú docente.' },
    ] },
  ],
  problems: [
    '“Marcar como clase dictada” se activa sólo cuando llega la fecha y hora programadas.',
    'Si un estudiante no aparece como destinatario, revisa que tenga una matrícula activa en esa aula.',
    'Las invitaciones y altas de cuenta se gestionan desde Administración, no desde el panel del profesor.',
  ],
};

export function HelpGuide({ audience }: { audience: 'student' | 'teacher' }) {
  const guide = audience === 'student' ? studentGuide : teacherGuide;
  const returnHref = audience === 'student' ? '/' : '/teacher';
  const returnLabel = audience === 'student' ? 'Volver a Mi panel' : 'Volver al panel del profesor';
  return (
    <main id="top" className="min-h-screen bg-speaking-background px-4 py-5 sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="relative overflow-hidden rounded-2xl border border-speaking-cobalt/10 bg-gradient-to-br from-white via-white to-speaking-background p-5 shadow-[0_12px_32px_rgba(16,52,105,0.07)] sm:p-7">
          <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-speaking-cobalt via-speaking-king to-speaking-mustard" />
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-speaking-mustard/20 text-speaking-cobalt"><BookOpenCheck className="h-6 w-6" aria-hidden="true" /></span>
            <div>
              <p className="font-body text-xs font-bold uppercase tracking-[0.12em] text-speaking-king">Centro de ayuda · {audience === 'student' ? 'Estudiantes' : 'Profesores'}</p>
              <h1 className="mt-1 font-title text-3xl text-speaking-cobalt">{guide.title}</h1>
              <p className="mt-2 max-w-3xl font-body text-sm leading-6 text-speaking-cobalt/75">{guide.description}</p>
            </div>
          </div>
        </header>

        <nav aria-label="Índice de la guía" className="rounded-2xl border border-speaking-cobalt/10 bg-white p-4 shadow-[0_5px_20px_rgba(16,52,105,0.045)] sm:p-5">
          <h2 className="font-title text-lg text-speaking-cobalt">En esta guía</h2>
          <ol className="mt-3 grid gap-2 sm:grid-cols-2">
            {guide.sections.map((section) => <li key={section.id}><a href={`#${section.id}`} className="inline-flex min-h-10 items-center rounded-lg px-2 font-body text-sm font-semibold text-speaking-king underline-offset-4 hover:bg-speaking-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-cobalt focus-visible:outline-offset-2">{section.title}</a></li>)}
            <li><a href="#common-problems" className="inline-flex min-h-10 items-center rounded-lg px-2 font-body text-sm font-semibold text-speaking-king underline-offset-4 hover:bg-speaking-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-cobalt focus-visible:outline-offset-2">Problemas comunes</a></li>
          </ol>
        </nav>

        {guide.sections.map((section, sectionIndex) => (
          <section key={section.id} id={section.id} className="scroll-mt-5 overflow-hidden rounded-2xl border border-speaking-cobalt/10 bg-gradient-to-br from-white via-white to-speaking-background/70 shadow-[0_8px_26px_rgba(16,52,105,0.055)]">
            <header className="border-b border-speaking-cobalt/10 border-t-4 border-t-speaking-mustard px-4 py-4 sm:px-5">
              <h2 className="font-title text-xl text-speaking-cobalt">{section.title}</h2>
            </header>
            <ol className="divide-y divide-speaking-cobalt/10 px-4 sm:px-5">
              {section.steps.map((step, stepIndex) => {
                const stepNumber = guide.sections.slice(0, sectionIndex).reduce((count, previous) => count + previous.steps.length, 0) + stepIndex + 1;
                return (
                  <li key={step.title} className="grid gap-3 py-4 sm:grid-cols-[2.25rem_minmax(0,1fr)] sm:gap-4 sm:py-5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-speaking-cobalt font-title text-base text-white">{stepNumber}</span>
                    <div className="min-w-0">
                      <h3 className="font-body text-base font-bold text-speaking-cobalt">{step.title}{step.unavailable && <span className="ml-2 inline-flex rounded-full bg-speaking-mustard/20 px-2 py-1 align-middle font-body text-xs font-bold text-speaking-cobalt">No disponible</span>}</h3>
                      <p className="mt-1.5 font-body text-sm leading-6 text-speaking-cobalt/80">{step.body}</p>
                      {step.see && <p className="mt-3 rounded-lg border-l-2 border-speaking-king bg-speaking-white px-3 py-2 font-body text-sm leading-6 text-speaking-cobalt/80"><strong className="font-bold text-speaking-cobalt">Qué deberías ver:</strong> {step.see}</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}

        <section id="common-problems" className="rounded-2xl border border-speaking-cobalt/10 bg-white p-4 shadow-[0_5px_20px_rgba(16,52,105,0.045)] sm:p-5">
          <div className="flex items-center gap-2"><CircleHelp className="h-5 w-5 text-speaking-king" aria-hidden="true" /><h2 className="font-title text-xl text-speaking-cobalt">Problemas comunes</h2></div>
          <ul className="mt-3 list-disc space-y-2 pl-5 font-body text-sm leading-6 text-speaking-cobalt/80">
            {guide.problems.map((problem) => <li key={problem}>{problem}</li>)}
          </ul>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-speaking-cobalt/10 pt-4">
          <Link href={returnHref} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-speaking-cobalt px-4 font-body text-sm font-semibold text-white transition-colors hover:bg-speaking-king focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-cobalt focus-visible:outline-offset-2"><ArrowLeft className="h-4 w-4" aria-hidden="true" />{returnLabel}</Link>
          <a href="#top" className="inline-flex min-h-11 items-center rounded-lg px-3 font-body text-sm font-semibold text-speaking-cobalt underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-cobalt focus-visible:outline-offset-2">Volver al inicio de la guía</a>
        </footer>
      </div>
    </main>
  );
}

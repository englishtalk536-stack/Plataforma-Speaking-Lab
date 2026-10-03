# SpeakingLab: Arquitectura de Producto

## 1. Propósito de SpeakingLab

SpeakingLab es una plataforma educativa de inglés centrada en el aprendizaje progresivo, la práctica oral y el seguimiento pedagógico.

El producto debe conectar:

- currículo por niveles MCER;
- objetivos de aprendizaje;
- actividades;
- clases;
- asistencia;
- entregas;
- evaluación;
- feedback;
- progreso;
- práctica autónoma;
- gamificación;
- IA educativa.

La plataforma debe priorizar la trazabilidad educativa. XP, Coins, Streak, Badges e IA deben reforzar el aprendizaje real y no convertirse en sistemas independientes del currículo.

Estados utilizados:

- **IMPLEMENTADO**: existe código funcional y persistencia verificable.
- **PARCIAL**: existe una base funcional, pero falta integración o cobertura.
- **PROPUESTO**: decisión de arquitectura de transición aún no implementada.
- **FUTURO**: funcionalidad pospuesta hasta validar el MVP.

## 2. Prioridad del producto

La prioridad de SpeakingLab es:

1. Educación.
2. Seguimiento.
3. Gamificación.
4. Práctica autónoma.
5. IA.
6. Monetización.

### Educación

El currículo, los objetivos, las actividades y las clases son la fuente primaria de valor.

### Seguimiento

El sistema debe registrar asistencia, evaluaciones, feedback, intentos y progreso.

### Gamificación

XP, Coins, Streak y Badges deben representar acciones educativas verificables.

### Práctica autónoma

La práctica oral debe estar ligada a un nodo curricular, un nivel y un objetivo.

### IA

La IA debe ayudar con práctica, evaluación y feedback sin reemplazar la autoridad pedagógica del profesor.

### Monetización

Membresías, tienda, vouchers y pagos deben llegar después de estabilizar el ciclo educativo.

## 3. Estado actual real del proyecto

**Estado general: PARCIALMENTE IMPLEMENTADO**

El proyecto actual es una aplicación Next.js 16 con React 19, TypeScript, Prisma y SQLite local.

Existe un dashboard de estudiante en `/`.

Existe una práctica oral en `/practice/[nodeId]`.

Existe persistencia para:

- usuario;
- XP;
- Coins;
- Streak;
- SkillPath;
- UserLessonProgress;
- misiones diarias;
- Feedback Radar.

Existe una base de autenticación con NextAuth, Credentials, bcryptjs, Google opcional y roles.

No existen todavía:

- dashboard de profesor;
- dashboard de administrador;
- aulas funcionales;
- membresías;
- actividades generales;
- entregas;
- asistencia explícita;
- evaluaciones docentes;
- sistema completo de badges;
- tienda operativa;
- leaderboard;
- marketplace.

No existe `docs/current-state-audit.md`; este documento se basa en `CLAUDE.md`, `AGENTS.md`, el estado real del código y el informe de auditoría realizado.

## 4. Funcionalidades actualmente implementadas

### Dashboard de estudiante

**Estado: IMPLEMENTADO**

La ruta `/` renderiza el dashboard del estudiante.

Incluye:

- perfil;
- nivel;
- XP;
- Coins;
- Streak;
- SkillPath;
- Feedback Radar;
- Daily Voice Warm-up;
- Order with Confidence;
- navegación hacia práctica.

Archivos principales:

- `src/app/page.tsx`
- `src/components/dashboard/*`
- `src/app/api/student/dashboard/route.ts`
- `src/lib/hooks/useDashboardData.ts`

### SkillPath

**Estado: IMPLEMENTADO / PARCIAL**

Existe un mapa visual de nodos con estados:

- `LOCKED`;
- `CURRENT`;
- `COMPLETED`.

Los nodos actuales y completados pueden abrir `/practice/[nodeId]`.

La UI funciona, pero el contenido curricular todavía está dividido entre:

- datos sembrados en Prisma;
- catálogo hardcodeado en `src/lib/ai/practice-context.ts`.

### PracticeSession

**Estado: IMPLEMENTADO**

Existe una sesión de cinco turnos con:

- Speech Recognition nativo;
- Speech Synthesis nativo;
- fallback de respuesta escrita;
- intentos de repetición;
- evaluación del transcript;
- detección off-topic;
- feedback por turno;
- repetición de audio;
- resumen final;
- envío de métricas;
- persistencia de completion.

Archivos principales:

- `src/app/practice/[nodeId]/page.tsx`
- `src/components/practice/PracticeSession.tsx`
- `src/components/practice/VoiceAssistantCard.tsx`
- `src/components/practice/AudioRecorderControls.tsx`
- `src/components/practice/PronunciationFeedback.tsx`
- `src/lib/hooks/useSpeechRecognition.ts`
- `src/lib/hooks/useSpeechSynthesis.ts`

### XP, Coins y Streak

**Estado: IMPLEMENTADO**

Existe un motor server-side para:

- XP;
- Coins;
- subida de nivel;
- Streak;
- freeze credits;
- `XpLog`.

La implementación principal utilizada por las APIs está en:

- `src/server/gamification-engine.service.ts`

Existe una segunda implementación relacionada en:

- `src/gamification/gamification-engine.service.ts`

### Feedback Radar

**Estado: IMPLEMENTADO / PARCIAL**

Existe un radar visual para:

- fluidez;
- gramática;
- pronunciación;
- vocabulario.

El completion de una lección actualiza los valores agregados del usuario.

No existe todavía historial temporal de snapshots ni un modelo completo de feedback.

### Autenticación

**Estado: PARCIAL**

Existe:

- NextAuth;
- Credentials;
- bcryptjs;
- Google opcional;
- callbacks JWT/session;
- `id` y `role` en la sesión;
- `/login`;
- `/register`;
- middleware RBAC;
- fallback local de desarrollo.

Archivos principales:

- `src/lib/auth-options.ts`;
- `src/lib/auth.ts`;
- `src/app/api/auth/[...nextauth]/route.ts`;
- `src/app/api/auth/register/route.ts`;
- `src/app/login/page.tsx`;
- `src/app/register/page.tsx`;
- `src/middleware.ts`.

### Modelos Prisma existentes

**Estado: IMPLEMENTADO**

El esquema incluye:

- `User`;
- `Role`;
- `Streak`;
- `XpLog`;
- `Badge`;
- `UserBadge`;
- `SkillNode`;
- `UserSkillProgress`;
- `UserLessonProgress`;
- `StoreItem`;
- `UserInventory`;
- `AiConversation`;
- `AiMessage`;
- `ClassBooking`;
- `TeacherFeedback`;
- `DailyQuest`;
- `UserDailyQuest`.

La base local actual usa SQLite.

## 5. Funcionalidades parciales

### Autenticación y autorización

NextAuth está configurado, pero la arquitectura todavía convive con un fallback local de desarrollo basado en:

- `LOCAL_USER_ID`;
- `x-user-id`;
- `LOCAL_DEV_AUTH_BYPASS`.

El fallback no debe utilizarse en producción.

### Currículo

Prisma contiene metadatos curriculares como:

- `cefrLevel`;
- `challengeText`;
- `targetVocabulary`;
- `grammarHints`.

Sin embargo, `practice-context.ts` mantiene todavía parte del currículo en código.

### Progreso

Existe:

- `UserSkillProgress`;
- `UserLessonProgress`;
- score agregado;
- intentos;
- completion.

Falta historial detallado por turno y por competencia.

### IA

Existe `src/ai/ai-practice.service.ts` y soporte Anthropic, pero la frontera entre Next.js, servicios server-side y la capa Nest/Anthropic todavía no está completamente consolidada.

### Clases

Existe `ClassBooking`, pero no existe el ciclo funcional de una clase online.

## 6. Funcionalidades que todavía no existen

No existen como producto funcional:

- dashboard de profesor;
- dashboard de administrador;
- aulas;
- membresías;
- actividades genéricas;
- entregas;
- asistencia explícita;
- rúbricas docentes;
- historial completo de feedback;
- tienda operativa;
- marketplace;
- leaderboard;
- videoconferencia propia;
- IA de voz en tiempo real;
- event bus distribuido;
- microservicios.

Los roles `TEACHER` y `ADMIN` existen en Prisma y sesión, pero sus superficies de producto todavía no existen.

## 7. Fuentes de verdad

### Asistencia

**Estado actual: PARCIAL**

`ClassBooking` es la única base existente relacionada con clases.

**Fuente futura propuesta:**

- entidad de asistencia;
- entrada;
- salida;
- minutos;
- estado;
- evidencia opcional.

### Evaluación

**Estado actual: PARCIAL**

La evaluación oral se realiza mediante heurísticas en:

- `src/lib/ai/evaluate-transcript.ts`.

**Fuente futura propuesta:**

- evaluación automática versionada;
- evaluación docente;
- rúbricas;
- criterios;
- score por competencia.

### Feedback

**Estado actual: PARCIAL**

El Feedback Radar y el feedback por turno son las representaciones actuales.

**Fuente futura propuesta:**

- feedback asociado a actividad;
- autor;
- criterio;
- score;
- comentario;
- fecha;
- visibilidad.

### Progreso

**Estado actual: PARCIAL**

La fuente actual combina:

- `UserSkillProgress`;
- `UserLessonProgress`;
- `User.currentXp`;
- `User.level`;
- valores del Radar.

**Fuente futura propuesta:**

Prisma y servicios de dominio, nunca el estado local de la UI.

### XP y Coins

**Estado actual: IMPLEMENTADO**

- `User.currentXp` y `User.coins` son saldos agregados.
- `XpLog` es el historial de XP.
- `GamificationEngineService` es la autoridad de recompensa.

### Streak

**Estado actual: IMPLEMENTADO**

`Streak` es la fuente persistida de:

- racha actual;
- máxima racha;
- última actividad;
- freeze credits.

## 8. Roles

### Estudiante

**Estado: IMPLEMENTADO / PARCIAL**

Puede:

- consultar su dashboard;
- practicar;
- completar misiones;
- completar lecciones;
- consultar su progreso.

Debe acceder únicamente a sus datos.

### Profesor

**Estado: PARCIAL**

El rol existe, pero no existe dashboard ni API de profesor.

Debe poder, en el futuro:

- consultar alumnos de sus aulas;
- revisar progreso;
- revisar entregas;
- registrar feedback;
- gestionar asistencia;
- revisar clases.

### Administrador

**Estado: PARCIAL**

El rol existe, pero no existe dashboard ni API de administración.

Debe poder, en el futuro:

- gestionar usuarios;
- gestionar roles;
- configurar currículo;
- gestionar aulas;
- administrar reglas globales.

## 9. Arquitectura funcional futura

El producto futuro se organizará alrededor de estos módulos:

### Usuarios

Identidad, perfil, rol, preferencias y estado de cuenta.

### Aulas

Grupo educativo con profesor, estudiantes, nivel y currículo asociado.

### Membresías

Relación usuario-aula con rol, estado, fechas y permisos.

### Clases

Reserva, sesión, modalidad, profesor, estudiantes y estado.

### Asistencia

Registro de presencia, ausencia, duración y evidencia.

### Objetivos

Competencias y resultados de aprendizaje por nivel y currículo.

### Actividades

Práctica oral, tarea, quiz, actividad de clase o misión.

### Entregas

Respuesta o resultado producido por el estudiante.

### Evaluación

Evaluación automática, docente o combinada con rúbrica y versión.

### Feedback

Comentarios, scores, recomendaciones y radar.

### Progreso

Progreso por usuario, aula, nodo, actividad, objetivo y periodo.

### Práctica

Sesiones guiadas de voz vinculadas al currículo.

### Gamificación

XP, Coins, Streak, Badges y recompensas.

### IA

Práctica conversacional, evaluación asistida y feedback contextual.

## 10. Elementos actuales que se conservarán

Se conservarán:

- `User`;
- `Role`;
- `Streak`;
- `XpLog`;
- `SkillNode`;
- `UserSkillProgress`;
- `UserLessonProgress`;
- `Badge`;
- `UserBadge`;
- `DailyQuest`;
- `UserDailyQuest`;
- `ClassBooking`;
- `TeacherFeedback`;
- `AiConversation`;
- `AiMessage`;
- `StoreItem`;
- `UserInventory`;
- dashboard del estudiante;
- SkillPath;
- PracticeSession;
- Feedback Radar;
- motor de XP, Coins y Streak;
- fallback local únicamente para desarrollo.

No deben eliminarse componentes existentes durante la transición sin verificar sus referencias.

## 11. Elementos actuales que deberán adaptarse

### `User`

Puede necesitar:

- preferencias;
- zona horaria;
- onboarding;
- relación OAuth formal;
- estado de cuenta.

### `SkillNode`

Debe ser la fuente curricular única.

Los campos curriculares serializados deberán evolucionar hacia contratos consistentes cuando el producto lo necesite.

### `UserSkillProgress`

Debe coordinarse con:

- actividades;
- objetivos;
- aulas;
- `UserLessonProgress`.

### `UserLessonProgress`

Debe representar progresivamente:

- intentos;
- mejor score;
- último score;
- estado;
- métricas por competencia;
- actividad de origen.

### `DailyQuest`

Debe conectarse explícitamente con nodos o actividades de práctica.

### `ClassBooking`

Debe complementarse con asistencia y sesión online.

### `Badge`

Debe conectarse a eventos de dominio verificables.

### Auth

Debe separar claramente:

- sesión real;
- autorización;
- fallback de desarrollo;
- helpers de servidor.

## 12. Duplicaciones que deben resolverse

### Componentes

Existen duplicados en:

- `src/components/`;
- `src/components/dashboard/`.

La fuente canónica debe ser:

- `src/components/dashboard` para dashboard;
- `src/components/practice` para práctica.

Los duplicados de `src/components` deben congelarse, migrar referencias y eliminarse solo después de verificar usos.

### Servicios de gamificación

Existen:

- `src/server/gamification-engine.service.ts`;
- `src/gamification/gamification-engine.service.ts`.

La fuente canónica debe ser `src/server/gamification-engine.service.ts`, que es la usada por los Route Handlers actuales.

### Tipos

Existen tipos relacionados en:

- `src/types`;
- `src/lib/types`.

La fuente canónica propuesta es `src/lib/types`.

### Currículo

El currículo se duplica entre:

- `prisma/seed.ts`;
- `src/lib/ai/practice-context.ts`;
- datos consumidos por dashboard.

Debe existir una única fuente curricular persistida.

## 13. Estrategia para unificar el currículo

1. Mantener `SkillNode` como fuente de verdad.
2. Mantener los IDs de nodos estables.
3. Leer desde Prisma los datos usados por dashboard.
4. Resolver el contexto de `/practice/[nodeId]` desde Prisma.
5. Mantener `practice-context.ts` solo como adaptador temporal o fallback.
6. Migrar gradualmente desafíos, vocabulario y pistas a Prisma.
7. Evitar que el frontend tenga un catálogo paralelo.
8. Versionar cambios curriculares mediante seeds o una futura herramienta administrativa.
9. Cubrir con pruebas que el dashboard y PracticeSession resuelvan el mismo nodo.

## 14. Estrategia para proteger el dashboard

### Estado actual

- `/` es el dashboard real.
- `/practice/[nodeId]` es privado.
- Las APIs tienen comprobación propia de usuario.
- El middleware protege páginas privadas.
- El fallback local está restringido a desarrollo con opt-in.

### Estrategia

1. Mantener `/` como entrada actual para no romper enlaces.
2. Hacer la comprobación de sesión antes de renderizar el dashboard.
3. Redirigir usuarios anónimos a `/login`.
4. Mantener protección independiente dentro de cada API.
5. Nunca confiar solo en middleware.
6. No aceptar `x-user-id` en producción.
7. Mantener el fallback local únicamente para scripts de desarrollo explícitamente autorizados.
8. No migrar todavía de `middleware` a `proxy`.
9. Considerar `/dashboard` como ruta canónica futura, no como cambio inmediato.

## 15. Estrategia de autenticación

### Estado actual

NextAuth usa:

- Credentials;
- bcryptjs;
- sesiones JWT;
- callbacks de sesión;
- Google opcional.

### Estrategia

- Prisma `User` es la fuente de verdad de identidad.
- NextAuth es la fuente de verdad de sesión.
- `User.role` es la fuente de verdad de RBAC.
- Las APIs deben resolver sesión en servidor.
- La UI nunca debe decidir permisos por sí sola.
- `x-user-id` solo puede existir como fallback de desarrollo.
- Google no debe considerarse listo para producción hasta configurar y probar credenciales reales.
- Recuperación de contraseña y verificación de email quedan fuera del MVP actual.

## 16. Estrategia de pruebas

**Estado actual: FUTURO**

No existe todavía framework ni suite de tests.

Estrategia mínima propuesta:

- Vitest para unit tests y Route Handler tests;
- mocks de `getCurrentUserId`;
- SQLite de prueba separada para integración;
- no usar `prisma/dev.db` en tests;
- tests del motor de gamificación;
- tests de dashboard sin sesión;
- tests de completion idempotente;
- tests de recompensa XP única;
- tests de Streak;
- tests de Feedback Radar;
- tests de quests;
- Playwright solo posteriormente para un flujo E2E de login → dashboard → práctica.

Archivos futuros propuestos:

```text
vitest.config.ts
tests/setup.ts
tests/helpers/test-data.ts
tests/helpers/mock-auth.ts
tests/api/student-dashboard.route.test.ts
tests/api/lesson-complete.route.test.ts
tests/api/quest-complete.route.test.ts
tests/server/gamification-engine.service.test.ts
tests/lib/radar-blend.test.ts
```

No deben instalarse dependencias ni crearse esos archivos como parte de esta documentación.

## 17. Orden de implementación por pasos pequeños

### Paso 1: Identidad y acceso

- validar Credentials;
- proteger `/`;
- proteger APIs;
- probar roles y acceso anónimo.

### Paso 2: Currículo único

- verificar `SkillNode`;
- eliminar dependencia progresiva del catálogo hardcodeado;
- hacer que práctica y dashboard lean el mismo nodo.

### Paso 3: Práctica y completion

- mantener PracticeSession;
- persistir completion;
- garantizar XP, Coins, Streak y Radar;
- probar idempotencia.

### Paso 4: Seguimiento docente mínimo

- introducir aula;
- membresías;
- vista de alumnos;
- feedback docente.

### Paso 5: Clases y asistencia

- reserva;
- asistencia;
- sesión online externa;
- historial.

### Paso 6: Gamificación ampliada

- activar Badges por eventos;
- definir catálogo y recompensas;
- construir Store solo después de validar el ciclo educativo.

### Paso 7: IA

- aislar Anthropic;
- definir contratos;
- mantener fallback heurístico;
- incorporar evaluación asistida.

### Paso 8: Monetización

- membresías comerciales;
- pagos;
- vouchers;
- catálogo comercial.

## 18. Funcionalidades que no se deben implementar todavía

Quedan explícitamente fuera del MVP actual:

- marketplace;
- leaderboard;
- IA de voz en tiempo real;
- videoconferencia propia;
- microservicios;
- event bus distribuido;
- dashboard completo de profesor;
- dashboard completo de administrador;
- pagos y suscripciones;
- tienda operativa;
- análisis fonético profesional;
- certificados;
- multitenancy;
- notificaciones multicanal;
- recuperación de contraseña;
- verificación de correo;
- analítica avanzada histórica.

## 19. Criterios para aprobar nuevas funcionalidades

Una nueva funcionalidad solo debe aprobarse si:

1. Tiene un objetivo educativo o de seguimiento claramente definido.
2. Identifica su rol y permisos.
3. Define su fuente de verdad.
4. No duplica una entidad o servicio existente sin justificación.
5. Tiene un contrato claro entre UI, API y Prisma.
6. No introduce lógica de negocio únicamente en componentes cliente.
7. Usa transacciones cuando modifica recompensas o progreso.
8. Es idempotente cuando puede repetirse.
9. Incluye una estrategia mínima de pruebas.
10. No rompe login, dashboard, práctica ni APIs existentes.
11. Mantiene SQLite local y el stack actual durante la transición.
12. No crea entidades futuras antes de que exista una necesidad validada.
13. No añade IA o monetización antes de estabilizar el ciclo educativo.
14. Tiene criterios de éxito observables.
15. Documenta si su estado es IMPLEMENTADO, PARCIAL, PROPUESTO o FUTURO.

## Decisión de transición

El núcleo prioritario de SpeakingLab es:

1. identidad;
2. currículo;
3. práctica;
4. completion;
5. progreso.

Las aulas, evaluaciones docentes, dashboards de profesor, monetización y capacidades avanzadas de IA deben construirse después de que este ciclo sea estable, probado y trazable desde la interfaz hasta Prisma.

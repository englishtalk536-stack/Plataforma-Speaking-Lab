# Preparación de piloto: Vercel + Neon

**Estado:** instrucciones preparatorias. No se crearon recursos, no se migró ninguna base y no se desplegó la aplicación.

## Aislamiento de entornos

1. En Vercel, importar el repositorio GitHub como proyecto Next.js. `vercel.json` fija `npm run build:postgres`; genera el cliente PostgreSQL y compila, pero **no ejecuta migraciones**.
2. Crear dos proyectos Neon separados, uno para Preview/pruebas y otro para Production. Crear una base vacía en cada uno. No copiar `dev.db`, cuentas locales, registros E2E ni backups SQLite.
3. En **Vercel → Project → Settings → Environment Variables**, asignar las variables de Preview a Neon de pruebas y las de Production a Neon de producción. No reutilizar URLs, roles ni secretos entre ambos.
4. En cada entorno configurar `DATABASE_URL` con la URL pooled de Neon; `DIRECT_URL` con la URL directa; `NEXTAUTH_URL` con la URL pública del entorno; `NEXTAUTH_SECRET` con un valor aleatorio único; `ACCOUNT_INVITATIONS_ENABLED=false` inicialmente. Si se usa Google OAuth, registrar callbacks del entorno y configurar `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` por separado.
5. No pegar ni mostrar valores secretos en chats. Introducirlos sólo en el panel seguro de Vercel o en el gestor local de secretos del operador.

## Perfiles Prisma y comandos

- `npm run dev` genera Prisma Client desde `prisma/schema.prisma` (SQLite local) y arranca Next.js.
- `npm run build` también usa el perfil SQLite local.
- `npm run build:postgres` genera el cliente desde `prisma/postgresql/schema.prisma` y compila para Vercel.
- `npm run db:deploy:postgres` aplica migraciones manualmente sólo si `DATABASE_URL` y `DIRECT_URL` apuntan a Neon y se confirma con `NEON_MIGRATION_CONFIRM=APPLY_POSTGRES_MIGRATIONS`. Revisar el destino; el baseline está pensado para una base vacía.
- `npm run db:catalog:postgres` carga manualmente 6 nodos padre, 52 prácticas y 12 misiones mediante upserts transaccionales. Requiere `POSTGRES_CATALOG_CONFIRM=LOAD_SPEAKINGLAB_CATALOG` y ambas URLs `*.neon.tech` para la misma base (se admite el sufijo `-pooler`); no se ejecuta durante build. Sólo escribe `skill_nodes` y `daily_quests`, no datos de usuarios ni actividad.
- `npm run seed` sigue disponible sólo para fixtures locales: `prisma/seed.ts` aborta si `DATABASE_URL` no es exactamente `file:./dev.db`. No ejecutar seeds en Neon.
- `npm run admin:create:postgres` es un comando privado e interactivo para crear la primera cuenta ADMIN. Requiere `DATABASE_URL`, `DIRECT_URL` y `ADMIN_BOOTSTRAP_CONFIRM=CREATE_FIRST_ADMIN` en el entorno de terminal, URLs `*.neon.tech`, una terminal TTY y contraseña introducida sin eco. Se niega si ya existe ADMIN o si el correo está ocupado; no actualiza ni eleva usuarios. No ejecutarlo desde Vercel Build.

## Migración PostgreSQL

- El schema y las migraciones SQLite originales permanecen en `prisma/schema.prisma` y `prisma/migrations/`; hay copia byte a byte en `prisma/sqlite-archive/`.
- El schema PostgreSQL independiente está en `prisma/postgresql/schema.prisma`; su baseline es `prisma/postgresql/migrations/20261102000000_initial_postgresql/migration.sql`. El baseline se generó desde un schema vacío, no desde `dev.db`.
- Revisar el baseline y aplicarlo **sólo** a Neon de pruebas después de comprobar que la URL destino corresponde a Preview. Comando manual: `npm run db:deploy:postgres`.
- Verificar las tablas y autenticación en Preview con datos sintéticos creados allí. No ejecutar `prisma db seed`: el seed existente inserta usuarios y contenido locales.
- Tras aplicar el baseline y verificar Neon de Preview, ejecutar el cargador de catálogo desde un terminal privado; revisar manualmente el destino antes de establecer la confirmación. Las prácticas no incluyen archivos de audio: la voz usa SpeechSynthesis del navegador y la conversación/evaluación depende de `ANTHROPIC_API_KEY`. Confirmar soporte de voz del navegador y disponibilidad/configuración del servicio antes de considerar esas prácticas listas.
- Tras aprobar piloto y recuperación, aplicar el baseline manualmente a Neon de producción vacío. El build y deploy no ejecutan `migrate deploy` automáticamente.

## Primera cuenta ADMIN e invitaciones

1. Aplicar primero el baseline a la base vacía de Preview y verificar la URL/entorno en Vercel.
2. En un terminal privado, establecer `DATABASE_URL`, `DIRECT_URL` y `ADMIN_BOOTSTRAP_CONFIRM=CREATE_FIRST_ADMIN` desde un gestor seguro de secretos; no mostrarlos ni guardarlos en el repo.
3. Ejecutar `npm run admin:create:postgres` en una terminal interactiva con las URLs de Preview. Oculta la contraseña, exige al menos 14 caracteres, usa un lock transaccional, falla si ya existe ADMIN o si el email ya pertenece a una cuenta (sin distinguir mayúsculas) y nunca eleva ni sobrescribe usuarios.
4. Probar inicio de sesión ADMIN; crear invitaciones sólo después de verificar permisos y aceptación de token único con vencimiento. Activar `ACCOUNT_INVITATIONS_ENABLED=true` en ese entorno sólo cuando esté listo para admitir invitaciones.

## Restaurar el perfil SQLite local

El flujo local sigue usando `prisma/schema.prisma` y `prisma/migrations/`. El `.env` local debe conservar `DATABASE_URL="file:./dev.db"`. `npm run dev` y `npm run build` generan el cliente SQLite. Si se reemplaza accidentalmente el schema local, restaurarlo desde `prisma/sqlite-archive/schema.prisma`; si se modifica el historial local, comparar/restaurar desde `prisma/sqlite-archive/migrations/`. Nunca copiar el historial PostgreSQL a `prisma/migrations/` ni apuntar el schema SQLite a una URL PostgreSQL. `DATABASE_URL` local y `dev.db` no se migran ni se copian a Neon.

## Bloqueos antes de publicación

- Revisión/aprobación humana del baseline PostgreSQL antes de aplicarlo a cualquier Neon.
- Conectar y comprobar primero Preview/Neon de pruebas; confirmar persistencia y recuperación.
- Completar prueba funcional autenticada de ambos roles en Preview, incluidos los permisos y la aceptación de invitación.
- Confirmar dominio estable para producción y `NEXTAUTH_URL`/callbacks OAuth correspondientes.
- Mantener la SQLite local y sus registros E2E separados; no hay procedimiento de migración de esos datos a producción en este plan.

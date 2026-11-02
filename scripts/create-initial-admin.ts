import { createInterface } from 'node:readline';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

class BootstrapGuardError extends Error {}

function assertNeonUrl(name: 'DATABASE_URL' | 'DIRECT_URL'): void {
  const value = process.env[name];
  if (!value) throw new BootstrapGuardError(`Set ${name} in the secure terminal environment before running this command.`);

  try {
    const parsed = new URL(value);
    if (!['postgres:', 'postgresql:'].includes(parsed.protocol) || !parsed.hostname.endsWith('.neon.tech')) {
      throw new Error('Invalid target');
    }
  } catch {
    throw new BootstrapGuardError(`${name} must point to the intended Neon PostgreSQL database.`);
  }
}

function askVisible(prompt: string): Promise<string> {
  const readline = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => readline.question(prompt, (answer) => {
    readline.close();
    resolve(answer.trim());
  }));
}

function askHidden(prompt: string): Promise<string> {
  const input = process.stdin;
  if (!input.isTTY || typeof input.setRawMode !== 'function') {
    throw new BootstrapGuardError('Run this command directly in an interactive terminal so the password can stay hidden.');
  }

  return new Promise((resolve, reject) => {
    let value = '';
    const cleanup = () => {
      input.off('data', onData);
      input.setRawMode(false);
      input.pause();
      process.stdout.write('\n');
    };
    const onData = (chunk: Buffer | string) => {
      const characters = chunk.toString('utf8');
      if (characters.includes('\u0003')) {
        cleanup();
        reject(new BootstrapGuardError('Bootstrap cancelled.'));
        return;
      }
      for (const character of characters) {
        if (character === '\r' || character === '\n') {
          cleanup();
          resolve(value);
          return;
        }
        if (character === '\u007f' || character === '\b') {
          value = Array.from(value).slice(0, -1).join('');
        } else if (!/[\u0000-\u001f\u007f]/.test(character)) {
          value += character;
        }
      }
    };

    process.stdout.write(prompt);
    input.setRawMode(true);
    input.resume();
    input.on('data', onData);
  });
}

async function main() {
  if (process.env.ADMIN_BOOTSTRAP_CONFIRM !== 'CREATE_FIRST_ADMIN') {
    throw new BootstrapGuardError('Set ADMIN_BOOTSTRAP_CONFIRM=CREATE_FIRST_ADMIN explicitly to confirm first-admin bootstrap.');
  }
  assertNeonUrl('DATABASE_URL');
  assertNeonUrl('DIRECT_URL');

  const fullName = await askVisible('Admin full name: ');
  const email = (await askVisible('Admin email: ')).toLowerCase();
  if (fullName.length < 2 || fullName.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new BootstrapGuardError('Enter a valid name and email address.');
  }

  const password = await askHidden('Admin password (hidden): ');
  const confirmation = await askHidden('Confirm password (hidden): ');
  if (password !== confirmation || password.length < 14 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new BootstrapGuardError('Passwords must match and contain 14–72 UTF-8 bytes.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const prisma = new PrismaClient();
  try {
    await prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw`SELECT pg_advisory_xact_lock(827341960321::bigint)`;
      const existingAdmin = await transaction.user.findFirst({ where: { role: Role.ADMIN }, select: { id: true } });
      if (existingAdmin) throw new BootstrapGuardError('An ADMIN account already exists; no account was changed.');

      const existingUsers = await transaction.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "users" WHERE LOWER("email") = LOWER(${email}) LIMIT 1
      `;
      if (existingUsers.length > 0) throw new BootstrapGuardError('That email already belongs to an account; no role was changed.');

      await transaction.user.create({ data: { fullName, email, passwordHash, role: Role.ADMIN } });
    }, { isolationLevel: 'Serializable' });
  } finally {
    await prisma.$disconnect();
  }

  console.log('Initial administrator created. No password or account data was printed.');
}

main().catch((error: unknown) => {
  if (error instanceof BootstrapGuardError) console.error(error.message);
  else console.error('Bootstrap failed. Verify the selected Neon database and operator privileges; sensitive details were withheld.');
  process.exitCode = 1;
});

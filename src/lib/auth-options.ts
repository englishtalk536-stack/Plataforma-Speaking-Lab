import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

const providers: NextAuthOptions['providers'] = [
  CredentialsProvider({
    name: 'Email and password',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials.password) return null;
      const user = await prisma.user.findUnique({ where: { email: credentials.email.toLowerCase().trim() } });
      if (!user?.passwordHash || !(await bcrypt.compare(credentials.password, user.passwordHash))) return null;
      return { id: user.id, name: user.fullName, email: user.email, image: user.avatarUrl, role: user.role };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: '/login' },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        const dbUser = await prisma.user.upsert({
          where: { email: user.email.toLowerCase() },
          update: { fullName: user.name ?? user.email, avatarUrl: user.image },
          create: { email: user.email.toLowerCase(), fullName: user.name ?? user.email, avatarUrl: user.image },
        });
        user.id = dbUser.id;
        user.role = dbUser.role;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? '';
        session.user.role = token.role ?? 'STUDENT';
      }
      return session;
    },
  },
};

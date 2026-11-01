import type { Metadata } from 'next';
import { anton, montserrat } from '../lib/fonts';
import { AuthSessionProvider } from '../components/SessionProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Speaking Lab',
  description: 'Gamified, interactive English learning.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${anton.variable} ${montserrat.variable}`}>
      <body><AuthSessionProvider>{children}</AuthSessionProvider></body>
    </html>
  );
}

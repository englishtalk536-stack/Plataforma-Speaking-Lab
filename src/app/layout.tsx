import type { Metadata } from 'next';
import { anton } from '../lib/fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'SpeakingLab',
  description: 'Gamified, interactive English learning.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={anton.variable}>
      <body>{children}</body>
    </html>
  );
}

import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/app/**/*.{ts,tsx}', './src/components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        speaking: {
          cobalt: '#0D1B2A', // Azul institucional para fondos principales y headers
          king: '#205088', // Botones primarios, nodos activos, acentos de marca
          mustard: '#EAB135', // Speaking Coins, acentos gamificados, highlights, bordes activos
          white: '#FFFFFF',
          background: '#F4F6F8', // Fondo general de la aplicación
          card: '#FFFFFF', // Superficies de tarjetas y paneles
          border: '#D9E0E7', // Bordes neutros de tarjetas
          streak: '#F97316', // Fuego de racha activa
          success: '#10B981', // Nodos completados, barra de progreso de XP
          locked: '#64748B', // Nodos y candados inactivados
        },
      },
      fontFamily: {
        title: ['var(--font-anton)', 'Anton', 'sans-serif'],
        body: ['Tahoma', 'Verdana', 'Segoe UI', 'sans-serif'],
      },
      keyframes: {
        'flame-flicker': {
          '0%, 100%': { transform: 'scaleY(1) scaleX(1) rotate(0deg)' },
          '25%': { transform: 'scaleY(1.06) scaleX(0.97) rotate(-1.5deg)' },
          '50%': { transform: 'scaleY(0.97) scaleX(1.03) rotate(1deg)' },
          '75%': { transform: 'scaleY(1.03) scaleX(0.98) rotate(-0.5deg)' },
        },
      },
      animation: {
        'flame-flicker': 'flame-flicker 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;

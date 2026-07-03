import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        primary: ['"ABC Diatype Variable Unlicensed Trial"', 'sans-serif'],
        secondary: ['"OCR-A BT"', 'monospace'],
      },
      fontSize: {
        body: ['13px', { lineHeight: '18px' }],
      },
      letterSpacing: {
        primary: '0.39px',
        secondary: '-0.13px',
      },
    },
  },
  plugins: [],
};

export default config;

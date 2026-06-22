import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        offme: {
          bg: 'var(--color-offme-bg)',
          surface: 'var(--color-offme-surface)',
          border: 'var(--color-offme-border)',
          text: 'var(--color-offme-text)',
          muted: 'var(--color-offme-muted)',
          hover: 'var(--color-offme-hover)',
          accent: '#1d9bf0',
          accentHover: '#1a8cd8',
          like: '#f91880',
          repost: '#00ba7c',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
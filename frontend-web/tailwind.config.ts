import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        offme: {
          bg: '#ffffff',
          surface: '#f7f9f9',
          border: '#eff3f4',
          text: '#0f1419',
          muted: '#536471',
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
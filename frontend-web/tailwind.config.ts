import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        pulse: {
          bg: '#000000',
          surface: '#16181c',
          border: '#2f3336',
          text: '#e7e9ea',
          muted: '#71767b',
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
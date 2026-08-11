import type { Config } from 'tailwindcss'

// 配色の実体は app/globals.css の CSS 変数側にある。
// 実物サイトに寄せる調整は globals.css の :root だけ触れば済む。
const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        cb: {
          bg: 'rgb(var(--cb-bg) / <alpha-value>)',
          surface: 'rgb(var(--cb-surface) / <alpha-value>)',
          raised: 'rgb(var(--cb-raised) / <alpha-value>)',
          border: 'rgb(var(--cb-border) / <alpha-value>)',
          text: 'rgb(var(--cb-text) / <alpha-value>)',
          muted: 'rgb(var(--cb-muted) / <alpha-value>)',
          accent: 'rgb(var(--cb-accent) / <alpha-value>)',
          'accent-strong': 'rgb(var(--cb-accent-strong) / <alpha-value>)',
          gold: 'rgb(var(--cb-gold) / <alpha-value>)',
          silver: 'rgb(var(--cb-silver) / <alpha-value>)',
          bronze: 'rgb(var(--cb-bronze) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['var(--cb-font-sans)'],
      },
      maxWidth: {
        shell: '1200px',
      },
    },
  },
  plugins: [],
}

export default config

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html','./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT:'#2563eb', hover:'#1d4ed8', dim:'rgba(37,99,235,0.08)', light:'#eff6ff', border:'rgba(37,99,235,0.2)' },
        sidebar: '#0f172a',
      },
      fontFamily: { mono: ['JetBrains Mono','Fira Code','monospace'] },
    },
  },
  plugins: [],
}

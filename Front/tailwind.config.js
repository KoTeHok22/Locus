/** @type {import('tailwindcss').Config} */  // ← Одна звездочка и большая C
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",  // ← Правильный синтаксис пути!
  ],
  theme: {  // ← theme как объект!
    extend: {}
  },
  plugins: [],
}
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': {
          '50': '#f5f8f6',
          '100': '#dee9e4',
          '200': '#bdd2ca',
          '300': '#8cada1',
          '400': '#6e9386',
          '500': '#54786d',
          '600': '#425f57',
          '700': '#374e47',
          '800': '#2f403b',
          '900': '#2a3733',
          '950': '#151e1c',
      },  
      },
    },
    },
  plugins: [],
}

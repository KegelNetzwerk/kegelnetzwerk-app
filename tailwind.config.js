/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'media',
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#005982',
        'primary-dark': '#004268',
        'primary-light': '#E6F4FE',
        secondary: '#3089ac',
        accent: '#a91a1a',
      },
    },
  },
  plugins: [],
};

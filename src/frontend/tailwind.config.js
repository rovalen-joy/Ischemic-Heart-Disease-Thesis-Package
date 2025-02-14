/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      backgroundImage: {
        login: "url('./assets/login-bg.png')",
      },
      colors: {
        primary: '#2da9b5',
        'dark-blue': '#05747F',
        'light-blue': '##70D1DA',
      },
    },
  },
  plugins: [],
}

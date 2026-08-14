/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        pixel: ["VT323", "sans-serif"],
        press: ["PressStart2P", "sans-serif"],
      },
    },
  },
  plugins: [],
}

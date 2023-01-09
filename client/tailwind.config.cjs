/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Inter", "system-ui"] },
      animation: {
        "fade-in": "fadein 0.2s ease-in-out",
        "fade-out": "fadeout 0.2s ease-in-out",
        blob: "blob 7s infinite",
      },
      keyframes: {
        fadein: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeout: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        blob: {
          "0%": {
            transform: "translate(0px, 0px) scale(1)",
          },
          "33%": {
            transform: "translate(10px, -10px) scale(1.2)",
          },
          "66%": {
            transform: "translate(-10px, 10px) scale(1)",
          },
          "100%": {
            transform: "tranlate(0px, 0px) scale(1.2)",
          },
        },
      },
    },
  },
  plugins: [],
};

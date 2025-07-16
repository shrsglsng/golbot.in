/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./shared/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cblue: "#FF9800",
        cbluel: "#FFB74D",
        cblued: "#F57C00",
        cred: "#FF4F4F",
      },
    },
  },
  plugins: [],
};

// red
// colors: {
//   cblue: "#F44336",
//   cbluel: "#E57373",
//   cblued: "#D32F2F",
//   cred: "#FF4F4F",
// },

// green
// colors: {
//   cblue: "#4caf50",
//   cbluel: "#3d8c40",
//   cblued: "#2e6930",
//   cred: "#FF4F4F",
// },

// purple
// colors: {
//   cblue: "#8883F0",
//   cbluel: "#aca8f4",
//   cblued: "#6f69ed",
//   cred: "#FF4F4F",
// },

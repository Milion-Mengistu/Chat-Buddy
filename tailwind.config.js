/** @type {import('tailwindcss').Config} */
module.exports = {
  // prefix: 'tw-',
  content: [
    "./ChatApp/templates/*.html", // Flask templates folder
    "./ChatApp/static/*.js",      // Your custom JavaScript files
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#121212',  // Dark background
        'dark-gray': '#181818', // Secondary dark background
        'light-text': '#E0E0E0',  // Light text
        'muted-text': '#A0A0A0',  // Muted text
        'link-text': '#66BB6A',   // Link color
        'btn-bg': '#333333',    // Button background
        'btn-hover': '#6200EE',  // Button hover color
        'primary-action': '#BB86FC',  // Primary action color
        'border-divider': '#333333',
        'deep-dark': '#171717',
          // Border color
      },
    },
  },
  plugins: [],
};



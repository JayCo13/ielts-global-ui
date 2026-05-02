module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        'scale-check': {
          '0%': { transform: 'scale(0)' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' }
        },
        'shimmer': {
          '100%': { transform: 'translateX(100%)' },
        }
      },
      animation: {
        'scale-check': 'scale-check 0.5s ease-in-out',
        'shimmer': 'shimmer 1.5s infinite'
      }
    }
  }
}
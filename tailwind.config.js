/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: '#f5efe2',
        ink: '#07080a',
        volt: '#38c8ff',
        // Dynamic Theme Colors using CSS Variables
        primary: {
          50: 'var(--color-primary-50, #f3f6f5)',
          100: 'var(--color-primary-100, #e7eeeb)',
          200: 'var(--color-primary-200, #ceddd6)',
          300: 'var(--color-primary-300, #a6c3b7)',
          400: 'var(--color-primary-400, #7aa498)',
          500: 'var(--color-primary-500, #5a8679)',
          600: 'var(--color-primary-600, #4a6d63)',
          700: 'var(--color-primary-700, #3e5a53)',
          800: 'var(--color-primary-800, #2f4742)',
          900: 'var(--color-primary-900, #1c332f)',
          950: 'var(--color-primary-950, #0f1c19)',
        },
        secondary: {
          50: 'var(--color-secondary-50, #fdfcf8)',
          100: 'var(--color-secondary-100, #faf8ef)',
          200: 'var(--color-secondary-200, #f5f0dc)',
          300: 'var(--color-secondary-300, #ede5c2)',
          400: 'var(--color-secondary-400, #e4d7a4)',
          500: 'var(--color-secondary-500, #e0d39f)',
          600: 'var(--color-secondary-600, #d4c485)',
          700: 'var(--color-secondary-700, #c4b069)',
          800: 'var(--color-secondary-800, #a6925a)',
          900: 'var(--color-secondary-900, #87784d)',
        },
        // Keep clover colors for backward compatibility (dynamic)
        clover: {
          900: 'var(--color-clover-900, #1c332f)',
          700: 'var(--color-clover-700, #4a6d63)',
          500: 'var(--color-clover-500, #7aa498)',
          300: 'var(--color-clover-300, #a6c3b7)',
          100: 'var(--color-clover-100, #f3f6f5)',
        },
        accent: {
          50: 'var(--color-accent-50, #f8fafc)',
          100: 'var(--color-accent-100, #f1f5f9)',
          200: 'var(--color-accent-200, #e2e8f0)',
          300: 'var(--color-accent-300, #cbd5e1)',
          400: 'var(--color-accent-400, #94a3b8)',
          500: 'var(--color-accent-500, #64748b)',
          600: 'var(--color-accent-600, #475569)',
          700: 'var(--color-accent-700, #334155)',
          800: 'var(--color-accent-800, #1e293b)',
          900: 'var(--color-accent-900, #0f172a)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['var(--font-display)', 'Arial Narrow', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'scan': 'scan 4s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(400%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
    },
  },
  plugins: [],
}

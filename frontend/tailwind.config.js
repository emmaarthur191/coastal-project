/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Coastal Premium Theme
        coastal: {
          dark: '#050a14',    // Darker Navy for Contrast
          light: '#ffffff',   // Pure White
          primary: '#0052CC', // Coastal Blue
          accent: '#DE350B',  // Brand Red
          success: '#36B37E', // Success Green
          surface: '#ffffff', // Pure White
          blue: '#0052CC',    // Sky Blue
        },
        // Deep Ocean Primary - #0284c7 (Light Blue) to #0c4a6e (Deep Ocean)
        primary: {
          50: '#deebff',
          100: '#b3d4ff',
          200: '#4c9aff',
          300: '#2684ff',
          400: '#0065e0',
          500: '#0052CC', // Coastal Blue
          600: '#0747a6',
          700: '#003884',
          800: '#00214a',
          900: '#001024',
          950: '#000812',
        },
        // Secondary - Slate Gray (Professional & Clean)
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        // Accent - Cyan (Growth/Digital)
        accent: {
          50: '#ffebe6',
          100: '#ffbdad',
          200: '#ff8b70',
          300: '#ff5630',
          400: '#ff3010',
          500: '#DE350B', // Brand Red
          600: '#bf2600',
          700: '#891b00',
          800: '#661400',
          900: '#330a00',
          950: '#1a0500',
        },
        // Error Red - Refined
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        // Warning Amber
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        // Success Emerald
        success: {
          50: '#e3fcef',
          100: '#abf2d1',
          200: '#79f2c0',
          300: '#57d9a3',
          400: '#36b37e', // Success Green
          500: '#00875a',
          600: '#006644',
          700: '#004d33',
          800: '#003322',
          900: '#001a11',
          950: '#000d08',
        },
        // Base Colors
        white: '#FFFFFF',
        black: '#000000',
        transparent: 'transparent',
      },
      fontFamily: {
        sans: ['Google Sans', 'Roboto', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        display: ['Google Sans Display', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        '144': '36rem',
      },
      minHeight: {
        'touch': '44px', // Minimum touch target size
      },
      minWidth: {
        'touch': '44px', // Minimum touch target size
      },
      maxWidth: {
        'screen-xs': '475px',
        'screen-sm': '640px',
        'screen-md': '768px',
        'screen-lg': '1024px',
        'screen-xl': '1280px',
        'screen-2xl': '1536px',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)',
        'elevated': '0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.06)',
        'float': '0 20px 40px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.08)',
        'focus-ring': '0 0 0 3px rgba(0, 102, 204, 0.1)',
        'focus-ring-error': '0 0 0 3px rgba(204, 0, 0, 0.1)',
        'focus-ring-warning': '0 0 0 3px rgba(255, 215, 0, 0.1)',
      },
      borderRadius: {
        'sm': '0.375rem',
        'DEFAULT': '0.5rem',
        'md': '0.625rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
        'full': '9999px',
      },
      borderWidth: {
        '3': '3px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
        'pulse-gentle': 'pulseGentle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s infinite linear',
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
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': {
            transform: 'translateY(-5%)',
            animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
          },
          '50%': {
            transform: 'translateY(0)',
            animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
          },
        },
        pulseGentle: {
          '50%': {
            opacity: '0.8',
          },
        },
        shimmer: {
          '0%': {
            transform: 'translateX(-100%)',
          },
          '100%': {
            transform: 'translateX(100%)',
          },
        },
      },
      backdropBlur: {
        'xs': '2px',
      },
      // Breakpoints for responsive design
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [],
}

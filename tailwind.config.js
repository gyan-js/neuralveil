/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
    theme: {
      extend: {
        colors: {
          bg:       '#050508',
          bg2:      '#0a0a10',
          bg3:      '#0e0e16',
          gold:     '#c9a84c',
          gold2:    '#e8c96a',
          ember:    '#ff5e1a',
          cyan:     '#00e5ff',
          'text-base': '#d4d0c8',
          'text-dim':  '#7a7870',
        },
        fontFamily: {
          bebas: ['"Bebas Neue"', 'cursive'],
          mono:  ['"Share Tech Mono"', 'monospace'],
          body:  ['Outfit', 'sans-serif'],
        },
        animation: {
          'pulse-slow':    'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          'flicker':       'flicker 3s linear infinite',
          'drift':         'drift 8s ease-in-out infinite',
          'scanline':      'scanline 6s linear infinite',
          'glow-pulse':    'glowPulse 2s ease-in-out infinite',
          'ember-float':   'emberFloat 5s ease-in-out infinite',
          'path-draw':     'pathDraw 3s ease forwards',
          'node-ping':     'nodePing 2s ease-in-out infinite',
          'slide-in-left': 'slideInLeft 0.8s ease forwards',
          'glitch':        'glitch 0.3s ease infinite',
          'chromatic':     'chromatic 4s linear infinite',
          'spin-slow':     'spin 12s linear infinite',
          'wave':          'wave 6s ease-in-out infinite',
        },
        keyframes: {
          flicker: {
            '0%,100%': { opacity: '1' },
            '33%':     { opacity: '0.85' },
            '66%':     { opacity: '0.95' },
            '80%':     { opacity: '0.7' },
          },
          drift: {
            '0%,100%': { transform: 'translateY(0px) translateX(0px)' },
            '33%':     { transform: 'translateY(-8px) translateX(4px)' },
            '66%':     { transform: 'translateY(4px) translateX(-4px)' },
          },
          scanline: {
            '0%':   { transform: 'translateY(-100%)' },
            '100%': { transform: 'translateY(100vh)' },
          },
          glowPulse: {
            '0%,100%': { boxShadow: '0 0 8px rgba(201,168,76,0.3)' },
            '50%':     { boxShadow: '0 0 24px rgba(201,168,76,0.7), 0 0 48px rgba(201,168,76,0.2)' },
          },
          emberFloat: {
            '0%':   { transform: 'translateY(0) scale(1)', opacity: '0.8' },
            '50%':  { transform: 'translateY(-20px) scale(1.2)', opacity: '1' },
            '100%': { transform: 'translateY(-40px) scale(0.6)', opacity: '0' },
          },
          nodePing: {
            '0%,100%': { opacity: '0.4', transform: 'scale(1)' },
            '50%':     { opacity: '1',   transform: 'scale(1.3)' },
          },
          pathDraw: {
            '0%':   { strokeDashoffset: '1000' },
            '100%': { strokeDashoffset: '0' },
          },
          glitch: {
            '0%,100%': { clipPath: 'inset(0 0 100% 0)', transform: 'translateX(0)' },
            '20%':     { clipPath: 'inset(33% 0 50% 0)',  transform: 'translateX(-4px)' },
            '40%':     { clipPath: 'inset(55% 0 10% 0)',  transform: 'translateX(4px)' },
            '60%':     { clipPath: 'inset(10% 0 70% 0)',  transform: 'translateX(-2px)' },
            '80%':     { clipPath: 'inset(80% 0 5% 0)',   transform: 'translateX(2px)' },
          },
          chromatic: {
            '0%,100%': { textShadow: '2px 0 #ff5e1a, -2px 0 #00e5ff' },
            '25%':     { textShadow: '-2px 0 #ff5e1a, 2px 0 #00e5ff' },
            '50%':     { textShadow: '0 2px #ff5e1a, 0 -2px #00e5ff' },
            '75%':     { textShadow: '2px 0 #00e5ff, -2px 0 #ff5e1a' },
          },
          wave: {
            '0%,100%': { transform: 'scaleX(1) scaleY(1)' },
            '50%':     { transform: 'scaleX(1.05) scaleY(0.97)' },
          },
        },
      },
    },
    plugins: [],
  }
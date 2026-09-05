/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        neon: { cyan: '#22d3ee', green: '#34d399', magenta: '#e879f9', amber: '#fbbf24' },
        abyss: '#04060e',
        panel: '#0a1120',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        display: ['"Segoe UI"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 0 30px rgba(34,211,238,0.08), inset 0 0 20px rgba(34,211,238,0.03)',
        'glow-cyan': '0 0 18px rgba(34,211,238,0.45)',
        'glow-magenta': '0 0 18px rgba(232,121,249,0.45)',
        'glow-green': '0 0 18px rgba(52,211,153,0.45)',
      },
      keyframes: {
        scanline: { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(100%)' } },
        pulseGlow: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.55' } },
      },
      animation: {
        scanline: 'scanline 2.4s linear infinite',
        'pulse-glow': 'pulseGlow 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

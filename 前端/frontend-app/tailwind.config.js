/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // 告诉 Tailwind 扫描 src 下的所有相关文件
  ],
  theme: {
    extend: {
      // 我们之前定义的高级字体和动画可以放在这里
      fontFamily: {
        'serif-cn': ['"Noto Serif SC"', 'serif'],
        'sans': ['"Noto Sans SC"', 'Inter', 'sans-serif'],
      },
      animation: {
        'slide-up-fade': 'slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        slideUpFade: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
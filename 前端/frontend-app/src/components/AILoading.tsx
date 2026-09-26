import { useState, useEffect } from 'react';

const LOGS = [
  "🔍 正在解析用户画像数据...",
  "🧠 连接 PathWise 核心神经网络...",
  " 扫描 224 个知识点图谱...",
  "⚖️ 计算职业匹配权重 (Machine Learning)...",
  "🚀 生成专属神经链路...",
  "✅ 规划完成。"
];

export default function AILoading() {
  const [currentLog, setCurrentLog] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLog((prev) => (prev + 1) % LOGS.length);
    }, 400); // 每 0.4 秒切换一行日志
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl">
      {/* 核心旋转动画 */}
      <div className="relative w-32 h-32 mb-8">
        <div className="absolute inset-0 border-4 border-indigo-500/30 rounded-full animate-[spin_3s_linear_infinite]" />
        <div className="absolute inset-2 border-4 border-t-cyan-400 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-[spin_1s_linear_infinite]" />
        <div className="absolute inset-4 border-4 border-b-indigo-400 border-t-transparent border-r-transparent border-l-transparent rounded-full animate-[spin_2s_linear_infinite_reverse]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl animate-pulse">🧠</span>
        </div>
      </div>

      {/* 滚动日志 */}
      <div className="font-mono text-sm text-cyan-400 h-6 overflow-hidden">
        <span className="animate-[slideUp_0.3s_ease-out]">{LOGS[currentLog]}</span>
      </div>
      
      <div className="mt-4 text-xs text-slate-500 tracking-widest">PATHWISE AI ENGINE v2.0</div>
    </div>
  );
}
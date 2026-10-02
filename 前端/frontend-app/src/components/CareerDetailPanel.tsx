// src/components/CareerDetailPanel.tsx
import { motion } from 'framer-motion';
import { useState } from 'react';
import SimulatorModal from './SimulatorModal';

interface CareerDetailPanelProps {
  career: any;
  onClose: () => void;
  onSimulationComplete: (careerId: number, success: boolean) => void;
}

// 📊 1. 定义全息雷达图组件
function HolographicRadar({ skills }: { skills: { name: string; level: number }[] }) {
  const dimensions = ["技术深度", "沟通协作", "抗压能力", "商业嗅觉", "逻辑思维", "领导力"];
  // 映射技能等级到雷达图的 6 个维度
  const values = [
    skills[0]?.level || 50, 
    skills[1]?.level || 50, 
    70, // 模拟数据
    60, // 模拟数据
    skills[2]?.level || 50, 
    80  // 模拟数据
  ];
  
  return (
    <div className="col-span-2 bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col items-center relative overflow-hidden">
      {/* 背景光效 */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none"></div>
      
      <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 w-full text-left z-10">能力雷达图 (Holographic Radar)</h3>
      
      <div className="relative w-48 h-48 my-2" style={{ perspective: '1000px' }}>
        <div className="absolute inset-0" style={{ transformStyle: 'preserve-3d', animation: 'spin3d 15s linear infinite' }}>
          <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">
            {/* 背景网格 */}
            {[20, 40, 60, 80].map((r, i) => (
              <polygon key={i} points={dimensions.map((_, idx) => {
                const angle = (Math.PI / 3) * idx - Math.PI / 2;
                return `${100 + r * Math.cos(angle)},${100 + r * Math.sin(angle)}`;
              }).join(' ')} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            ))}
            {/* 数据多边形 */}
            <polygon 
              points={values.map((v, idx) => {
                const angle = (Math.PI / 3) * idx - Math.PI / 2;
                const r = (v / 100) * 80;
                return `${100 + r * Math.cos(angle)},${100 + r * Math.sin(angle)}`;
              }).join(' ')} 
              fill="rgba(6, 182, 212, 0.2)" 
              stroke="#06b6d4" 
              strokeWidth="2" 
            />
            {/* 顶点 */}
            {values.map((v, idx) => {
              const angle = (Math.PI / 3) * idx - Math.PI / 2;
              const r = (v / 100) * 80;
              return (
                <circle 
                  key={idx}
                  cx={100 + r * Math.cos(angle)} 
                  cy={100 + r * Math.sin(angle)} 
                  r="3" 
                  fill="#06b6d4" 
                />
              );
            })}
          </svg>
        </div>
        {/* 标签 */}
        {dimensions.map((dim, idx) => {
          const angle = (Math.PI / 3) * idx - Math.PI / 2;
          const r = 110; // 标签稍微往外一点
          const x = 50 + (r / 2) * Math.cos(angle);
          const y = 50 + (r / 2) * Math.sin(angle);
          return (
            <div 
              key={idx}
              className="absolute text-[10px] text-cyan-400 font-bold z-10"
              style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
            >
              {dim}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CareerDetailPanel({ career, onClose, onSimulationComplete }: CareerDetailPanelProps) {
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  const skills = [
    { name: "核心专业技能", level: Math.floor(career.complexity * 100) },
    { name: "跨领域协作", level: Math.floor(50 + career.complexity * 40) },
    { name: "创新与解决", level: Math.floor(60 + Math.random() * 30) },
  ];

  const containerVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } }
  };

  const handleSimulatorComplete = (success: boolean) => {
    setIsSimulatorOpen(false);
    onSimulationComplete(career.id, success);
    onClose(); 
  };

  return (
    <>
      <motion.div 
        className="absolute top-0 right-0 w-full md:w-[450px] h-full bg-black/80 backdrop-blur-2xl border-l border-white/10 p-8 overflow-y-auto z-20 flex flex-col"
        initial="hidden" animate="visible" exit="hidden" variants={containerVariants}
      >
        <motion.button variants={itemVariants} onClick={onClose} className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </motion.button>

        <motion.div variants={itemVariants} className="mb-6 mt-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-bold rounded border border-indigo-500/30">
              匹配度 {career.match}%
            </span>
          </div>
          <h2 className="text-4xl font-bold text-white tracking-tight mb-4">{career.name}</h2>
          <p className="text-white/60 text-sm leading-relaxed">
            该职业节点复杂度系数为 {career.complexity.toFixed(2)}。系统已为您规划专属成长路径，涵盖核心理论与实战项目。
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* 核心技能 */}
          <motion.div variants={itemVariants} className="col-span-2 bg-white/5 border border-white/10 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">核心技能要求</h3>
            <div className="space-y-4">
              {skills.map((skill, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white/80">{skill.name}</span>
                    <span className="text-white/50">{skill.level}%</span>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <motion.div className="bg-indigo-500 h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${skill.level}%` }} transition={{ duration: 1, delay: 0.5 + idx * 0.1 }} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* 👇 新增：全息雷达图 */}
          <motion.div variants={itemVariants}>
            <HolographicRadar skills={skills} />
          </motion.div>

          {/* 数据卡片 */}
          <motion.div variants={itemVariants} className="flex flex-col gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-center flex-1">
              <span className="text-xs text-white/40 mb-1">星系坐标</span>
              <span className="text-lg font-semibold text-white font-mono text-xs">X:{career.position.x.toFixed(1)} Y:{career.position.y.toFixed(1)}</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-center flex-1">
              <span className="text-xs text-white/40 mb-1">节点复杂度</span>
              <span className="text-lg font-semibold text-white">{(career.complexity * 100).toFixed(0)}</span>
            </div>
          </motion.div>
        </div>

        <motion.div variants={itemVariants} className="mt-auto space-y-3">
          <button 
            onClick={() => setIsSimulatorOpen(true)}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-4 rounded-xl font-bold text-sm hover:from-cyan-400 hover:to-blue-400 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(6,182,212,0.5)]"
          >
            开始沉浸式模拟体验 →
          </button>
          <p className="text-center text-white/30 text-xs mt-3">预计耗时 5 分钟 · 高压职场场景</p>
        </motion.div>
      </motion.div>

      <SimulatorModal 
        isOpen={isSimulatorOpen} 
        career={career}
        onClose={() => setIsSimulatorOpen(false)} 
        onComplete={handleSimulatorComplete} 
      />
    </>
  );
}
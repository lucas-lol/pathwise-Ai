// src/components/IntroSequence.tsx
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface IntroSequenceProps {
  onComplete: () => void;
}

export default function IntroSequence({ onComplete }: IntroSequenceProps) {
  const [phase, setPhase] = useState<'logo' | 'hud' | 'done'>('logo');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hud'), 1500);
    const t2 = setTimeout(() => {
      setPhase('done');
      setTimeout(onComplete, 500); // 等待淡出动画完成
    }, 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onComplete]);

  const logs = [
    "> INITIALIZING PATHWISE CORE...",
    "> SYNCING NEURAL LINK... [OK]",
    "> LOADING SKILL MATRIX... [0 NODES]",
    "> CALIBRATING ABILITY RADAR... [OK]",
    "> CONNECTING TO CAREER UNIVERSE... [OK]",
    "> SYSTEM READY."
  ];

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden"
        >
          {/* 背景网格 */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

          {/* Phase 1: Logo */}
          {phase === 'logo' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 1.1 }}
              className="text-center z-10"
            >
              <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-4 tracking-tighter">
                PathWise AI
              </h1>
              <p className="text-white/40 text-sm tracking-[0.3em] uppercase">Map Your Destiny</p>
              <motion.div 
                initial={{ width: 0 }} 
                animate={{ width: "300px" }} 
                transition={{ delay: 0.5, duration: 1 }}
                className="h-[2px] bg-cyan-500 mx-auto mt-8"
              />
            </motion.div>
          )}

          {/* Phase 2: HUD */}
          {phase === 'hud' && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="absolute inset-0 flex items-center justify-center z-10"
            >
              {/* 左侧日志 */}
              <div className="absolute left-20 top-1/2 -translate-y-1/2 font-mono text-xs text-cyan-400/80 space-y-2">
                {logs.map((log, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.3 }}
                  >
                    {log}
                  </motion.div>
                ))}
              </div>

              {/* 右侧雷达图 (CSS 模拟) */}
              <div className="absolute right-20 top-1/2 -translate-y-1/2 w-48 h-48 relative">
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.3 }}
                    transition={{ delay: i * 0.2 }}
                    className="absolute inset-0 border border-cyan-500/30 rounded-full"
                    style={{ transform: `scale(${i * 0.3})` }}
                  />
                ))}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-t-2 border-cyan-400 rounded-full"
                />
              </div>

              {/* 中央大字 */}
              <motion.h2
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.5, type: "spring" }}
                className="text-4xl font-black text-white tracking-widest"
              >
                SYSTEM READY
              </motion.h2>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
// src/components/PersonaSelector.tsx
import { motion } from 'framer-motion';

export type Persona = 'student' | 'career-changer' | 'lifelong-learner';

interface PersonaSelectorProps {
  onSelect: (persona: Persona) => void;
}

const PERSONAS = [
  {
    id: 'student' as Persona,
    icon: '🎓',
    title: '迷茫的大学生',
    description: '想探索职业方向，找到适合自己的路',
    color: 'from-blue-500 to-cyan-500',
    goal: 'AI 架构师',
  },
  {
    id: 'career-changer' as Persona,
    icon: '💼',
    title: '想转行的职场人',
    description: '有明确目标，但需要补齐技能差距',
    color: 'from-purple-500 to-pink-500',
    goal: '技术专家',
  },
  {
    id: 'lifelong-learner' as Persona,
    icon: '🚀',
    title: '终身学习者',
    description: '想持续成长，不断拓展能力边界',
    color: 'from-orange-500 to-red-500',
    goal: '全栈大师',
  },
];

export default function PersonaSelector({ onSelect }: PersonaSelectorProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[90] bg-black/95 backdrop-blur-xl flex items-center justify-center"
    >
      <div className="text-center max-w-5xl mx-auto px-8">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-4"
        >
          你是谁？
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-white/60 text-lg mb-16"
        >
          选择你的身份，我们将为你定制专属的探索之旅
        </motion.p>

        <div className="grid grid-cols-3 gap-8">
          {PERSONAS.map((persona, idx) => (
            <motion.button
              key={persona.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + idx * 0.15, type: 'spring' }}
              onClick={() => onSelect(persona.id)}
              className="group relative p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-105 text-left"
            >
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${persona.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
              <div className="relative z-10">
                <div className="text-7xl mb-6">{persona.icon}</div>
                <h3 className="text-2xl font-bold text-white mb-3">{persona.title}</h3>
                <p className="text-white/60 text-base leading-relaxed">{persona.description}</p>
                <div className="mt-6 pt-6 border-t border-white/10">
                  <div className="text-xs text-white/40 uppercase tracking-wider mb-1">目标职业</div>
                  <div className="text-cyan-400 font-bold text-lg">{persona.goal}</div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
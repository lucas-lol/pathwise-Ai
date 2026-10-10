// src/components/AchievementPanel.tsx
import { motion } from 'framer-motion';
import { computeBadges, RARITY_STYLE, type GameStats } from '../utils/badges';

interface AchievementPanelProps {
  onBack: () => void;
  userSkills: Set<number>;
  unlockedPaths: Set<number>;
  abilityScores: number[];
  stats: GameStats;
}

export default function AchievementPanel({ onBack, userSkills, unlockedPaths, abilityScores, stats }: AchievementPanelProps) {
  const allBadges = computeBadges(userSkills.size, unlockedPaths.size, abilityScores, stats);
  const unlockedCount = allBadges.filter(b => b.unlocked).length;

  return (
    <div className="w-full h-screen bg-[#050810] flex flex-col text-white font-sans relative overflow-hidden">
      {/* 全息网格背景，与 AI 导师/学习中心视觉统一 */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(6,182,212,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050810_100%)] pointer-events-none"></div>
      
      {/* 顶部导航栏 */}
      <div className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-white/10 bg-black/40 backdrop-blur-md flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="group flex items-center gap-2 text-sm text-white/50 hover:text-cyan-400 transition-all">
            <span className="group-hover:-translate-x-1 transition-transform">←</span> 返回宇宙
          </button>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-xl shadow-lg">🏆</div>
          <div>
            <h2 className="font-bold text-sm tracking-wider">成就星图 · ACHIEVEMENTS</h2>
            <p className="text-yellow-400 text-xs flex items-center gap-1 font-mono">
              已解锁 <span className="font-bold">{unlockedCount}</span> / {allBadges.length}
            </p>
          </div>
        </div>
      </div>

      {/* 成就网格列表 */}
      <div className="relative z-10 flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {allBadges.map((badge, i) => (
            <motion.div 
              key={badge.name} 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: i * 0.05 }}
              className={`relative p-4 rounded-xl border backdrop-blur-md transition-all ${
                badge.unlocked 
                  ? RARITY_STYLE[badge.rarity] 
                  : 'border-white/5 bg-black/40 text-white/20'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className={`text-3xl ${!badge.unlocked ? 'grayscale opacity-30' : ''}`}>
                  {badge.icon}
                </span>
                {/* 未解锁成就右上角的锁头图标 */}
                {!badge.unlocked && (
                  <span className="absolute top-4 right-4 text-xs opacity-50">🔒</span>
                )} 
                <div>
                  <div className="font-bold text-sm">{badge.name}</div>
                  <div className="text-[10px] uppercase tracking-wider opacity-60">{badge.rarity}</div>
                </div>
              </div>
              
              {/* 描述文本，设置最小高度防止网格错位 */}
              <p className="text-xs opacity-80 mb-3 min-h-[32px]">{badge.desc}</p>
              
              {/* 进度条 */}
              {badge.progress && (
                <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${badge.unlocked ? 'bg-current' : 'bg-white/20'}`} 
                    style={{ width: `${(parseInt(badge.progress.split('/')[0]) / parseInt(badge.progress.split('/')[1])) * 100}%` }} 
                  ></div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
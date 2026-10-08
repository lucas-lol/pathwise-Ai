// src/utils/badges.ts
export interface Badge {
  icon: string;
  name: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  desc: string;
  unlocked: boolean;
  progress?: string;
}

// 与 CareerUniverse 中的状态结构保持一致
export interface GameStats {
  craftCount: number;
  crisisFixed: number;
  simSuccess: number;
  simFail: number;
  combo: number;
  maxCombo: number;
  xp: number;
  ratings: Record<number, 'S' | 'A' | 'B' | 'C' | string>;
}

export const RARITY_STYLE: Record<string, string> = {
  common: 'border-slate-500/40 text-slate-300 shadow-[0_0_10px_rgba(148,163,184,0.2)]',
  rare: 'border-blue-500/50 text-blue-300 shadow-[0_0_14px_rgba(59,130,246,0.35)]',
  epic: 'border-purple-500/50 text-purple-300 shadow-[0_0_16px_rgba(168,85,247,0.4)]',
  legendary: 'border-yellow-500/60 text-yellow-300 shadow-[0_0_20px_rgba(234,179,8,0.5)]',
};

export function computeBadges(skills: number, paths: number, scores?: number[], stats?: GameStats): Badge[] {
  const b: Badge[] = [];
  
  // 探索类
  b.push({ icon: '🌱', name: '初次点亮', rarity: 'common', desc: '点亮首颗职业星球', unlocked: skills >= 1, progress: `${Math.min(1, skills)}/1` });
  b.push({ icon: '⭐', name: '星系开拓者', rarity: 'rare', desc: '掌握 5 项职业技能', unlocked: skills >= 5, progress: `${Math.min(5, skills)}/5` });
  b.push({ icon: '🌌', name: '宇宙漫游者', rarity: 'epic', desc: '掌握 10 项职业技能', unlocked: skills >= 10, progress: `${Math.min(10, skills)}/10` });
  
  // 路径类
  b.push({ icon: '🛤️', name: '命运开启者', rarity: 'rare', desc: '解锁首条命运轨迹', unlocked: paths >= 1, progress: `${Math.min(1, paths)}/1` });
  b.push({ icon: '👑', name: '多轨主宰', rarity: 'legendary', desc: '解锁 3 条命运轨迹', unlocked: paths >= 3, progress: `${Math.min(3, paths)}/3` });
  
  // 能力类
  const maxScore = scores ? Math.max(...scores) : 0;
  b.push({ icon: '💎', name: '卓越专长', rarity: 'epic', desc: '任一能力突破 60', unlocked: maxScore >= 60, progress: `${maxScore}/60` });

  // P2 行动类
  const craft = stats?.craftCount || 0;
  b.push({ icon: '🧪', name: '炼金术士', rarity: 'rare', desc: '成功合成 3 次', unlocked: craft >= 3, progress: `${Math.min(3, craft)}/3` });
  
  const crisis = stats?.crisisFixed || 0;
  b.push({ icon: '🛡️', name: '危机化解者', rarity: 'epic', desc: '解除 5 次行业危机', unlocked: crisis >= 5, progress: `${Math.min(5, crisis)}/5` });
  
  const combo = stats?.maxCombo || 0;
  b.push({ icon: '🔥', name: '连击大师', rarity: 'legendary', desc: '达成 3 连击', unlocked: combo >= 3, progress: `${Math.min(3, combo)}/3` });
  
  const sCount = stats ? Object.values(stats.ratings).filter(r => r === 'S').length : 0;
  b.push({ icon: '🏆', name: '完美主义者', rarity: 'legendary', desc: '获得 3 次 S 评级', unlocked: sCount >= 3, progress: `${Math.min(3, sCount)}/3` });

  return b;
}
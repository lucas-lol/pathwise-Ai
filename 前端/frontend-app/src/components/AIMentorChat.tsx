// src/components/AIMentorChat.tsx
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GALAXY_NAMES } from '../data/careerAdapter';

interface AIMentorChatProps {
  onBack: () => void;
  userSkills: Set<number>;
  careers: any[];
  abilityScores: number[];
  userPersona: string | null;
  recipes?: Record<string, number>;
  userInterests?: Set<string>;
  onFlyToCareer?: (id: number) => void; // 🌟 新增：让导师能控制镜头
}

interface Message {
  id: number;
  role: 'mentor' | 'user';
  text: string;
  action?: { type: 'fly'; targetId: number; label: string }; // 🌟 新增：可交互动作
}

const ABILITY_LABELS = ["技术", "逻辑", "沟通", "抗压", "创新", "领导"];
const PERSONA_LABEL: Record<string, string> = { student: '大学生', 'career-changer': '转行职场人', 'lifelong-learner': '终身学习者' };

const COACH_MAP = [
  { boss: "Alex (技术总监)", drill: "线上 OOM 代码危机" },
  { boss: "David (量化总监)", drill: "实盘亏损归因危机" },
  { boss: "Sarah (产品副总裁)", drill: "跨部门汇报危机" },
  { boss: "Mike (首席架构师)", drill: "双十一高压排障" },
  { boss: "Sarah (产品副总裁)", drill: "竞品追赶创新危机" },
  { boss: "Eve (CISO)", drill: "凌晨安全事件指挥" },
];

interface StateAnalysis {
  categoryCount: number[];
  topCategory: number;
  weakestIdx: number;
  strongestIdx: number;
  readyToCraft: { a: number; b: number; resultId: number }[];
  oneStepCraft: { missing: number; resultId: number }[];
}

function analyzeState(userSkills: Set<number>, careers: any[], abilityScores: number[], recipes?: Record<string, number>): StateAnalysis {
  const categoryCount = [0, 0, 0, 0, 0];
  userSkills.forEach(id => { const c = careers.find((x: any) => x.id === id); if (c) categoryCount[c.category]++; });
  const topCategory = categoryCount.indexOf(Math.max(...categoryCount));
  const weakestIdx = abilityScores.indexOf(Math.min(...abilityScores));
  const strongestIdx = abilityScores.indexOf(Math.max(...abilityScores));
  const readyToCraft: { a: number; b: number; resultId: number }[] = [];
  const oneStepCraft: { missing: number; resultId: number }[] = [];
  Object.entries(recipes || {}).forEach(([key, resultId]) => {
    const [a, b] = key.split('-').map(Number);
    if (userSkills.has(resultId)) return;
    const hasA = userSkills.has(a);
    const hasB = userSkills.has(b);
    if (hasA && hasB) readyToCraft.push({ a, b, resultId });
    else if (hasA || hasB) oneStepCraft.push({ missing: hasA ? b : a, resultId });
  });
  return { categoryCount, topCategory, weakestIdx, strongestIdx, readyToCraft, oneStepCraft };
}

function buildInsights(s: StateAnalysis, careers: any[], userSkills: Set<number>, abilityScores: number[], userInterests?: Set<string>): string[] {
  const out: string[] = [];
  const name = (id: number) => careers[id]?.name || '未知职业';
  if (userSkills.size > 0) {
    out.push(`📉 你的【${ABILITY_LABELS[s.weakestIdx]}】只有 ${abilityScores[s.weakestIdx]} 分，是六维最弱。建议挑战 ${COACH_MAP[s.weakestIdx].boss} 的「${COACH_MAP[s.weakestIdx].drill}」补强。`);
    out.push(` 你的王牌是【${ABILITY_LABELS[s.strongestIdx]}】(${abilityScores[s.strongestIdx]} 分)，继续保持。`);
  }
  if (userInterests && userInterests.size > 0) {
    out.push(` 你的兴趣集中在【${Array.from(userInterests).join('、')}】，我已据此加权全宇宙匹配度，优先点亮高匹配星球。`);
  }
  if (s.readyToCraft.length > 0) {
    const r = s.readyToCraft[0];
    out.push(`🧪 合成台就绪：「${name(r.a)}」+「${name(r.b)}」→「${name(r.resultId)}」，现在就能合成！`);
  } else if (s.oneStepCraft.length > 0) {
    const r = s.oneStepCraft[0];
    out.push(` 距隐藏配方一步之遥：先点亮「${name(r.missing)}」，即可合成「${name(r.resultId)}」。`);
  }
  const cnt = s.categoryCount[s.topCategory];
  if (cnt > 0) {
    const need = Math.max(0, 5 - cnt);
    out.push(need === 0
      ? `🌌 【${GALAXY_NAMES[s.topCategory]}】已点亮 ${cnt} 星，命运轨迹已解锁！`
      : ` 【${GALAXY_NAMES[s.topCategory]}】已点亮 ${cnt} 星，再点亮 ${need} 颗即可解锁命运轨迹。`);
  }
  return out;
}

// 🌟 核心改动：返回结构化数据，支持 Action
function respond(input: string, s: StateAnalysis, careers: any[], userSkills: Set<number>, abilityScores: number[], userInterests?: Set<string>, userPersona?: string | null): { text: string; action?: { type: 'fly'; targetId: number; label: string } } {  const q = input.toLowerCase();
  const name = (id: number) => careers[id]?.name || '未知职业';
  const insights = buildInsights(s, careers, userSkills, abilityScores, userInterests);

  if (/能力|雷达|短板|弱|提升|强项/.test(q)) {
    if (userSkills.size === 0) return { text: "你还没有能力数据。先点亮第一颗星球并完成模拟，我才能做六维诊断。" };
    return { text: `六维画像：${abilityScores.map((v, i) => `${ABILITY_LABELS[i]} ${v}`).join(' / ')}。\n\n最该补【${ABILITY_LABELS[s.weakestIdx]}】→ 挑战 ${COACH_MAP[s.weakestIdx].boss} 的「${COACH_MAP[s.weakestIdx].drill}」；王牌是【${ABILITY_LABELS[s.strongestIdx]}】。` };
  }
  if (/合成|配方|解锁|隐藏/.test(q)) {
    if (s.readyToCraft.length > 0) {
      const r = s.readyToCraft[0];
      return { text: `现在就能合成：「${name(r.a)}」+「${name(r.b)}」→「${name(r.resultId)}」。打开合成图鉴点击该配方即可自动定位。` };
    }
    if (s.oneStepCraft.length > 0) {
      const r = s.oneStepCraft[0];
      return { text: `还差一步：点亮「${name(r.missing)}」后就能合成「${name(r.resultId)}」。把它作为下一个目标。` };
    }
    return { text: "暂无成熟合成机会。先专注点亮主攻星系的基础职业，配方会自动浮现。" };
  }
  if (/进度|下一步|学|路线|任务|目标|计划/.test(q)) {
    const cnt = s.categoryCount[s.topCategory];
    const target = careers.find((c: any) => c.category === s.topCategory && !userSkills.has(c.id) && c.tier === 0);
    return { 
      text: `主攻【${GALAXY_NAMES[s.topCategory]}】(已点亮 ${cnt} 星)。\n\n下一步：${target ? `挑战「${target.name}」，它是该星系不错的切入点。` : '基础已清空，尝试合成高阶或开拓新星系。'}\n\n学习中心 Daily Missions 已同步。`,
      action: target ? { type: 'fly', targetId: target.id, label: `飞往 ${target.name}` } : undefined
    };
  }
  if (/职业|推荐|适合|方向|选/.test(q)) {
    const interestRec = userInterests && userInterests.size > 0
      ? careers.find((c: any) => !userSkills.has(c.id) && (c.interestTags || []).some((t: string) => userInterests.has(t)))
      : undefined;
    const rec = interestRec || careers.find((c: any) => c.category === s.topCategory && !userSkills.has(c.id));
    return rec
      ? { 
          text: `结合你的轨迹${userInterests && userInterests.size > 0 ? '与兴趣标签' : ''}，推荐「${rec.name}」(${rec.categoryName})。要求：${(rec.requiredSkills || []).slice(0, 3).join('、')}。路径：${rec.careerPath || '暂无'}。`,
          action: { type: 'fly', targetId: rec.id, label: `查看 ${rec.name} 档案` }
        }
      : { text: "数据还太少，先点亮几颗星球，我才能给出有依据的推荐。" };
  }
  if (/迷茫|累|放弃|难|烦|挫败/.test(q)) {
    return { text: `我理解这种感受。但看数据：你已点亮 ${userSkills.size} 颗星球${userSkills.size > 0 ? `，最强维度【${ABILITY_LABELS[s.strongestIdx]}】达 ${abilityScores[s.strongestIdx]} 分` : ''}。成长是螺旋而非直线。休息一会儿，从最小一步开始，我陪你复盘。` };
  }
  if (/你好|hi|hello|在吗|嗨/.test(q)) {
    return { text: `你好${userPersona ? '，' + PERSONA_LABEL[userPersona] : ''}！我是你的数据感知导师。实时状态：\n\n${insights.join('\n\n') || '暂无数据，去点亮第一颗星球吧！'}\n\n想深聊哪个方面？` };
  }
  return { text: insights.length > 0 ? `让我扫描你的实时数据……\n\n${insights[Math.floor(Math.random() * insights.length)]}` : "你的宇宙还是空白。点击发白光的 START HERE 星球完成首次模拟，我们才有数据可聊。" };
}

export default function AIMentorChat({ onBack, userSkills, careers, abilityScores, userPersona, recipes, userInterests, onFlyToCareer }: AIMentorChatProps) {
  const state = analyzeState(userSkills, careers, abilityScores, recipes);
  const insights = buildInsights(state, careers, userSkills, abilityScores, userInterests);

  const greeting = userSkills.size === 0
    ? `你好${userPersona ? '，' + PERSONA_LABEL[userPersona] : ''}！我是你的 AI 导师。目前还没有数据——点击发白光的 START HERE 星球完成首次模拟，我就能开始个性化诊断。`
    : `你好${userPersona ? '，' + PERSONA_LABEL[userPersona] : ''}！实时状态扫描完成：\n\n${insights.join('\n\n')}`;

  const [messages, setMessages] = useState<Message[]>([{ id: 0, role: 'mentor', text: greeting }]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing]);

  const send = (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || typing) return;
    setInput('');
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text }]);
    setTyping(true);
    setTimeout(() => {
      const response = respond(text, state, careers, userSkills, abilityScores, userInterests, userPersona);      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'mentor', text: response.text, action: response.action }]);
      setTyping(false);
    }, 700);
  };

  const quickQuestions = ["我的能力短板是什么？", "我现在该合成什么？", "下一步学什么？", "给我推荐一个职业", "给我点鼓励"];

  return (
    <div className="w-full h-full bg-[#050810] flex flex-col text-white font-sans relative overflow-hidden">
      {/*  全息网格背景 */}
      <div className="absolute inset-0 pointer-events-none" 
           style={{ 
             backgroundImage: 'linear-gradient(rgba(6,182,212,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.05) 1px, transparent 1px)', 
             backgroundSize: '40px 40px' 
           }}></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050810_100%)] pointer-events-none"></div>

      {/* 顶栏 */}
      <div className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-cyan-500/20 bg-black/60 backdrop-blur-md flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="group flex items-center gap-2 text-sm text-white/50 hover:text-cyan-400 transition-all">
            <span className="group-hover:-translate-x-1 transition-transform">←</span> 返回宇宙
          </button>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(6,182,212,0.5)]">🤖</div>
          <div>
            <h2 className="font-bold text-sm tracking-wider">AI MENTOR · DATA LINKED</h2>
            <p className="text-green-400 text-[10px] flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
              SYSTEM ONLINE · SYNCED WITH RADAR/CODEx/PATHS
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {userPersona && <span className="text-[10px] px-2 py-1 rounded border border-purple-500/30 bg-purple-500/10 text-purple-300 font-mono">{PERSONA_LABEL[userPersona]?.toUpperCase()}</span>}
          <span className="text-[10px] text-white/40 font-mono border border-white/10 px-2 py-1 rounded">SKILLS: {userSkills.size}</span>
        </div>
      </div>

      {/* 消息区 */}
      <div className="relative z-10 flex-1 overflow-y-auto px-8 py-6 space-y-6 custom-scrollbar">
        <AnimatePresence>
          {messages.map(m => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] flex flex-col gap-2 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-5 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line shadow-lg backdrop-blur-sm border ${
                  m.role === 'user' 
                    ? 'bg-cyan-900/40 border-cyan-500/30 text-cyan-50 rounded-br-sm' 
                    : 'bg-black/60 border-white/10 text-white/90 rounded-bl-sm'
                }`}>
                  {m.text}
                </div>
                {/*  可交互 Action 按钮 */}
                {m.action && m.action.type === 'fly' && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    onClick={() => onFlyToCareer?.(m.action!.targetId)}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/50 text-cyan-300 text-xs font-bold hover:from-cyan-500/40 hover:to-blue-500/40 transition-all shadow-[0_0_10px_rgba(6,182,212,0.2)] group"
                  >
                    <span>🚀</span> {m.action.label}
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </motion.button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {typing && (
          <div className="flex justify-start">
            <div className="bg-black/60 border border-white/10 px-4 py-3 rounded-2xl rounded-bl-sm text-cyan-400/70 text-xs font-mono flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
              ANALYZING TELEMETRY...
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* 快捷问题 */}
      <div className="relative z-10 px-8 pb-3 flex gap-2 flex-wrap flex-shrink-0">
        {quickQuestions.map(q => (
          <button key={q} onClick={() => send(q)} className="text-[10px] px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/60 hover:border-cyan-500/50 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all font-mono uppercase tracking-wider">{q}</button>
        ))}
      </div>

      {/* 输入区 */}
      <div className="relative z-10 px-8 pb-6 flex-shrink-0">
        <div className="flex gap-3 bg-black/40 border border-white/10 rounded-xl p-1.5 backdrop-blur-md">
          <input 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && send()} 
            placeholder="输入指令或询问职业建议..." 
            className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-white/20 font-mono" 
          />
          <button onClick={() => send()} className="px-6 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)]">TRANSMIT</button>
        </div>
      </div>
    </div>
  );
}
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
}

interface Message { id: number; role: 'mentor' | 'user'; text: string; }

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

// 🌟 兴趣作为显式参数传入（模块级函数不能读 props）
function buildInsights(s: StateAnalysis, careers: any[], userSkills: Set<number>, abilityScores: number[], userInterests?: Set<string>): string[] {
  const out: string[] = [];
  const name = (id: number) => careers[id]?.name || '未知职业';
  if (userSkills.size > 0) {
    out.push(`📉 你的【${ABILITY_LABELS[s.weakestIdx]}】只有 ${abilityScores[s.weakestIdx]} 分，是六维最弱。建议挑战 ${COACH_MAP[s.weakestIdx].boss} 的「${COACH_MAP[s.weakestIdx].drill}」补强。`);
    out.push(`📈 你的王牌是【${ABILITY_LABELS[s.strongestIdx]}】(${abilityScores[s.strongestIdx]} 分)，继续保持。`);
  }
  if (userInterests && userInterests.size > 0) {
    out.push(`🎯 你的兴趣集中在【${Array.from(userInterests).join('、')}】，我已据此加权全宇宙匹配度，优先点亮高匹配星球。`);
  }
  if (s.readyToCraft.length > 0) {
    const r = s.readyToCraft[0];
    out.push(`🧪 合成台就绪：「${name(r.a)}」+「${name(r.b)}」→「${name(r.resultId)}」，现在就能合成！`);
  } else if (s.oneStepCraft.length > 0) {
    const r = s.oneStepCraft[0];
    out.push(`🧪 距隐藏配方一步之遥：先点亮「${name(r.missing)}」，即可合成「${name(r.resultId)}」。`);
  }
  const cnt = s.categoryCount[s.topCategory];
  if (cnt > 0) {
    const need = Math.max(0, 5 - cnt);
    out.push(need === 0
      ? `🌌 【${GALAXY_NAMES[s.topCategory]}】已点亮 ${cnt} 星，命运轨迹已解锁！`
      : `🌌 【${GALAXY_NAMES[s.topCategory]}】已点亮 ${cnt} 星，再点亮 ${need} 颗即可解锁命运轨迹。`);
  }
  return out;
}

function respond(input: string, s: StateAnalysis, careers: any[], userSkills: Set<number>, abilityScores: number[], userInterests?: Set<string>): string {
  const q = input.toLowerCase();
  const name = (id: number) => careers[id]?.name || '未知职业';
  const insights = buildInsights(s, careers, userSkills, abilityScores, userInterests);

  if (/能力|雷达|短板|弱|提升|强项/.test(q)) {
    if (userSkills.size === 0) return "你还没有能力数据。先点亮第一颗星球并完成模拟，我才能做六维诊断。";
    return `六维画像：${abilityScores.map((v, i) => `${ABILITY_LABELS[i]} ${v}`).join(' / ')}。\n\n最该补【${ABILITY_LABELS[s.weakestIdx]}】→ 挑战 ${COACH_MAP[s.weakestIdx].boss} 的「${COACH_MAP[s.weakestIdx].drill}」；王牌是【${ABILITY_LABELS[s.strongestIdx]}】。`;
  }
  if (/合成|配方|解锁|隐藏/.test(q)) {
    if (s.readyToCraft.length > 0) {
      const r = s.readyToCraft[0];
      return `现在就能合成：「${name(r.a)}」+「${name(r.b)}」→「${name(r.resultId)}」。打开合成图鉴点击该配方即可自动定位。`;
    }
    if (s.oneStepCraft.length > 0) {
      const r = s.oneStepCraft[0];
      return `还差一步：点亮「${name(r.missing)}」后就能合成「${name(r.resultId)}」。把它作为下一个目标。`;
    }
    return "暂无成熟合成机会。先专注点亮主攻星系的基础职业，配方会自动浮现。";
  }
  if (/进度|下一步|学|路线|任务|目标|计划/.test(q)) {
    const cnt = s.categoryCount[s.topCategory];
    const target = careers.find((c: any) => c.category === s.topCategory && !userSkills.has(c.id) && c.tier === 0);
    return `主攻【${GALAXY_NAMES[s.topCategory]}】(已点亮 ${cnt} 星)。\n\n下一步：${target ? `挑战「${target.name}」，它是该星系不错的切入点。` : '基础已清空，尝试合成高阶或开拓新星系。'}\n\n学习中心 Daily Missions 已同步。`;
  }
  if (/职业|推荐|适合|方向|选/.test(q)) {
    // 🌟 兴趣优先推荐
    const interestRec = userInterests && userInterests.size > 0
      ? careers.find((c: any) => !userSkills.has(c.id) && (c.interestTags || []).some((t: string) => userInterests.has(t)))
      : undefined;
    const rec = interestRec || careers.find((c: any) => c.category === s.topCategory && !userSkills.has(c.id));
    return rec
      ? `结合你的轨迹${userInterests && userInterests.size > 0 ? '与兴趣标签' : ''}，推荐「${rec.name}」(${rec.categoryName})。要求：${(rec.requiredSkills || []).slice(0, 3).join('、')}。路径：${rec.careerPath || '暂无'}。`
      : "数据还太少，先点亮几颗星球，我才能给出有依据的推荐。";
  }
  if (/迷茫|累|放弃|难|烦|挫败/.test(q)) {
    return `我理解这种感受。但看数据：你已点亮 ${userSkills.size} 颗星球${userSkills.size > 0 ? `，最强维度【${ABILITY_LABELS[s.strongestIdx]}】达 ${abilityScores[s.strongestIdx]} 分` : ''}。成长是螺旋而非直线。休息一会儿，从最小一步开始，我陪你复盘。`;
  }
  if (/你好|hi|hello|在吗|嗨/.test(q)) {
    return `你好${userPersona ? '，' + PERSONA_LABEL[userPersona] : ''}！我是你的数据感知导师。实时状态：\n\n${insights.join('\n\n') || '暂无数据，去点亮第一颗星球吧！'}\n\n想深聊哪个方面？`;
  }
  return insights.length > 0
    ? `让我扫描你的实时数据……\n\n${insights[Math.floor(Math.random() * insights.length)]}`
    : "你的宇宙还是空白。点击发白光的 START HERE 星球完成首次模拟，我们才有数据可聊。";
}

export default function AIMentorChat({ onBack, userSkills, careers, abilityScores, userPersona, recipes, userInterests }: AIMentorChatProps) {
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
      const reply = respond(text, state, careers, userSkills, abilityScores, userInterests);
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'mentor', text: reply }]);
      setTyping(false);
    }, 700);
  };

  const quickQuestions = ["我的能力短板是什么？", "我现在该合成什么？", "下一步学什么？", "给我推荐一个职业", "给我点鼓励"];

  return (
    <div className="w-full h-screen bg-[#050810] flex flex-col text-white font-sans relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none"></div>

      <div className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-white/10 bg-black/40 backdrop-blur-md flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="group flex items-center gap-2 text-sm text-white/50 hover:text-cyan-400 transition-all">
            <span className="group-hover:-translate-x-1 transition-transform">←</span> 返回宇宙
          </button>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-xl shadow-lg">🤖</div>
          <div>
            <h2 className="font-bold text-sm">AI 导师 · 数据感知版</h2>
            <p className="text-green-400 text-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
              已接入 雷达 / 合成台 / 星系进度 / 兴趣标签
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {userPersona && <span className="text-xs px-2 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300">{PERSONA_LABEL[userPersona]}</span>}
          <span className="text-xs text-white/40 font-mono">已点亮 {userSkills.size} 星</span>
        </div>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto px-8 py-6 space-y-4 custom-scrollbar">
        <AnimatePresence>
          {messages.map(m => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${m.role === 'user' ? 'bg-cyan-600/80 text-white rounded-br-sm' : 'bg-white/5 border border-white/10 text-white/90 rounded-bl-sm'}`}>
                {m.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {typing && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl rounded-bl-sm text-white/50 text-sm flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
              正在分析你的实时数据…
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="relative z-10 px-8 pb-3 flex gap-2 flex-wrap flex-shrink-0">
        {quickQuestions.map(q => (
          <button key={q} onClick={() => send(q)} className="text-xs px-3 py-1.5 rounded-full border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 transition-all">{q}</button>
        ))}
      </div>

      <div className="relative z-10 px-8 pb-6 flex-shrink-0">
        <div className="flex gap-3">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="问问能力短板、合成机会、兴趣匹配或下一步路线…" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-cyan-500/50 transition-colors placeholder:text-white/30" />
          <button onClick={() => send()} className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 font-bold text-sm hover:from-cyan-400 hover:to-blue-400 transition-all active:scale-95">发送</button>
        </div>
      </div>
    </div>
  );
}
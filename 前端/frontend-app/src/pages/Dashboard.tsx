import { useState, useEffect, useRef } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import MagneticButton from '../components/MagneticButton';

interface StateData {
  funnel: Record<string, boolean>;
  profile?: { grade?: string; interests?: string[]; goals?: string[]; scores?: any };
  selected_career?: string;
  mastery?: Record<string, number>;
}

const FUNNEL_STEPS = [
  { key: 'profile_complete', label: '画像完成', symbol: '👤' },
  { key: 'assessment_complete', label: '评估完成', symbol: '📝' },
  { key: 'career_selected', label: '职业选择', symbol: '💼' },
  { key: 'route_ready', label: '路线就绪', symbol: '' },
];

// 优化的 3D 卡片组件 (使用 CSS 变量，防止子组件闪烁)
const CardGlow = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotateX = (0.5 - y) * 8;
    const rotateY = (x - 0.5) * 8;
    
    // 直接修改 CSS 变量，不触发 React re-render
    cardRef.current.style.setProperty('--rotate-x', `${rotateX}deg`);
    cardRef.current.style.setProperty('--rotate-y', `${rotateY}deg`);
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.setProperty('--rotate-x', `0deg`);
    cardRef.current.style.setProperty('--rotate-y', `0deg`);
  };

  return (
    <div 
      ref={cardRef} 
      onMouseMove={handleMouseMove} 
      onMouseLeave={handleMouseLeave} 
      className={`card-glow-border ${className}`}
    >
      <div className="relative z-10 h-full w-full">
        {children}
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [state, setState] = useState<StateData | null>(null);
  const [error, setError] = useState('');
  const [knowledgeList, setKnowledgeList] = useState<any[]>([]);
  const [knowledgeLoading, setKnowledgeLoading] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const id = localStorage.getItem('pw_student_id');
    if (!id) { setError('未找到学号，请先完成画像。'); return; }
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);

    fetch(`http://localhost:8000/api/students/${id}/state`)
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        setState(data);
        return fetch(`http://localhost:8000/api/knowledge/points`).catch(() => null);
      })
      .then(res => res?.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data)) setKnowledgeList(data);
        setKnowledgeLoading(false);
      })
      .catch(() => { setKnowledgeLoading(false); });

    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (error) return <div className="min-h-screen flex items-center justify-center text-red-400">{error}</div>;
  if (!state) return <div className="min-h-screen flex items-center justify-center text-slate-400 text-2xl animate-pulse">正在连接学习宇宙...</div>;

  const funnel = state.funnel || {};
  const profile = state.profile || {};
  const badges = [profile.grade, ...(profile.interests || []), ...(profile.goals || [])].filter(Boolean) as string[];
  const currentGrade = profile.grade || '未知年级';

  return (
    <div className="min-h-screen aurora-bg text-slate-200 p-8 md:p-16 relative font-sans">
      {/* 1. 双层旋转背景光轮 (高级深邃色调) */}
      <div className="bg-rotate-wheel" />
      <div className="bg-rotate-wheel-reverse" />
      
      {/* 2. 强鼠标光晕 */}
      <div 
        className="mouse-glow"
        style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px) translate(-50%, -50%)` }}
      />
      
      {/* 3. 内容层 */}
      <div className="relative z-10 max-w-6xl mx-auto space-y-10">
        
        {/* 顶部标题 */}
        <div className="flex items-start justify-between mb-16 animate-fade-in-up delay-100">
          <div className="space-y-3">
            <h1 className="text-5xl md:text-7xl font-serif-cn font-bold text-white tracking-tight drop-shadow-2xl">
              欢迎回来，探索者
            </h1>
            <p className="text-slate-400 text-lg font-light max-w-xl">你的学习路径正在被系统实时演算与延伸。</p>
          </div>
          
          <button
            onClick={() => {
              if (window.confirm('确定要清除当前进度，开启一段新的探索旅程吗？')) {
                localStorage.removeItem('pw_student_id');
                window.location.href = '/';
              }
            }}
            className="group flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-500 backdrop-blur-md"
          >
            <span className="text-lg group-hover:rotate-180 transition-transform duration-700 text-slate-400"></span>
            <span className="text-sm font-medium text-slate-400 group-hover:text-white">开启新探索</span>
          </button>
        </div>

        {/* Hero Card */}
        <CardGlow className="p-12 min-h-[280px] flex items-center justify-between animate-fade-in-up delay-200">
          <div className="space-y-6 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium tracking-wider uppercase backdrop-blur-sm">
              当前职业目标
            </div>
            <h2 className="text-5xl md:text-7xl font-serif-cn font-bold text-white tracking-tight leading-tight drop-shadow-xl">
              {state.selected_career ? state.selected_career.replace(/_/g, ' ').toUpperCase() : 'UNASSIGNED'}
            </h2>
            <p className="text-slate-400 text-lg font-light leading-relaxed">
              核心算法已锁定该路径。系统将围绕此目标，动态分配知识节点与实战任务。
            </p>
          </div>
          <div className="hidden md:flex items-center justify-center w-32 h-32 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md shadow-inner">
             <span className="text-6xl filter drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">💼</span>
          </div>
        </CardGlow>

        {/* 漏斗状态 */}
        <CardGlow className="p-10 animate-fade-in-up delay-300">
          <h3 className="text-xl font-serif-cn font-medium text-white mb-10">学习路径进度</h3>
          
          <div className="relative space-y-12 pl-6">
            <div className="absolute left-[52px] top-6 bottom-6 w-0.5 bg-white/5 rounded-full overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full progress-glow" />
            </div>
            
            {FUNNEL_STEPS.map((step) => {
              const isDone = funnel[step.key] === true;
              return (
                <div key={step.key} className="relative flex items-center group/item">
                  <div className={`relative z-10 flex items-center justify-center w-14 h-14 rounded-full border transition-all duration-500 ${
                    isDone 
                      ? 'bg-indigo-500/20 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.4)]' 
                      : 'bg-slate-900/50 border-white/10 group-hover/item:border-white/20'
                  }`}>
                    {isDone ? <span className="text-white text-xl font-bold drop-shadow-md">✓</span> : <span className="text-slate-500 text-xl">○</span>}
                  </div>
                  
                  <div className="ml-8 flex-1">
                    <div className="flex items-center justify-between">
                      <div className={`text-2xl font-medium flex items-center gap-4 ${isDone ? 'text-white' : 'text-slate-500 group-hover/item:text-slate-300'}`}>
                        <span className="text-3xl">{step.symbol}</span>
                        {step.label}
                      </div>

                      {step.key === 'assessment_complete' && !isDone && (
                        <MagneticButton onClick={() => window.location.href = '/assessment'} className="bg-white/5 text-white border border-white/10 hover:bg-white/10 px-6 py-2 text-sm rounded-full backdrop-blur-md">
                          开始评估 →
                        </MagneticButton>
                      )}
                      {step.key === 'route_ready' && isDone && (
                        <div className="relative">
                          <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-30 animate-pulse" />
                          <MagneticButton onClick={() => window.location.href = '/route'} className="bg-indigo-600 text-white border border-indigo-500 hover:bg-indigo-500 px-6 py-2 text-sm rounded-full btn-pulse-strong" strength={0.4}>
                            查看我的专属路线 🚀
                          </MagneticButton>
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-slate-500 mt-2 ml-12 font-light">
                      {isDone ? '已完成' : '待解锁'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardGlow>

        {/* 画像与雷达图 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in-up delay-400">
          <CardGlow className="p-10">
            <h3 className="text-xl font-serif-cn font-medium text-white mb-8">个人画像标签</h3>
            <div className="flex gap-3 flex-wrap">
              {badges.length > 0 ? badges.map(b => (
                <span key={b} className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-full text-slate-300 text-sm hover:border-indigo-500/50 hover:text-white transition-all duration-300 cursor-default backdrop-blur-sm">
                  {b}
                </span>
              )) : <span className="text-slate-600 text-sm">暂无画像信息</span>}
            </div>
          </CardGlow>

          <CardGlow className="p-10">
            <h3 className="text-xl font-serif-cn font-medium text-white mb-2">AI 能力维度分析</h3>
            <p className="text-xs text-slate-500 mb-6 font-light">基于你的评估与画像生成</p>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                  { subject: '逻辑推理', A: 85 }, { subject: '计算能力', A: 65 },
                  { subject: '空间想象', A: 70 }, { subject: '数据分析', A: 90 }, { subject: '抽象思维', A: 75 },
                ]}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="能力值" dataKey="A" stroke="#818cf8" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardGlow>
        </div>

        {/* 知识点 */}
        {!knowledgeLoading && knowledgeList.length > 0 && (
          <CardGlow className="p-10 animate-fade-in-up delay-500">
            <h2 className="text-2xl font-serif-cn font-bold text-white mb-8">
              {currentGrade} 知识大纲 
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {knowledgeList.slice(0, 4).map((item: any) => (
                <div key={item.id} className="p-6 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all duration-500 group backdrop-blur-sm">
                  <div className="text-xs text-slate-500 mb-2 font-light">NODE: {item.id}</div>
                  <div className="text-base font-medium text-slate-300 group-hover:text-white transition-colors">[{item.chapter}] {item.name}</div>
                </div>
              ))}
            </div>
          </CardGlow>
        )}
      </div>
    </div>
  );
}
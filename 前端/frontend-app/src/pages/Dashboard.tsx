import { useState, useEffect, useRef } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface StateData {
  funnel: Record<string, boolean>;
  profile?: { 
    grade?: string; 
    interests?: string[]; 
    goals?: string[];
    scores?: any;
  };
  selected_career?: string;
  mastery?: Record<string, number>;
}

const FUNNEL_STEPS = [
  { key: 'profile_complete', label: '画像完成', symbol: '👤' },
  { key: 'assessment_complete', label: '评估完成', symbol: '📝' },
  { key: 'career_selected', label: '职业选择', symbol: '💼' },
  { key: 'route_ready', label: '路线就绪', symbol: '🚀' },
];

export default function Dashboard() {
  const [state, setState] = useState<StateData | null>(null);
  const [error, setError] = useState('');
  
  const [knowledgeList, setKnowledgeList] = useState<any[]>([]);
  const [knowledgeLoading, setKnowledgeLoading] = useState(true);

  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem('pw_student_id');
    if (!id) { 
      setError('未找到学号，请先完成画像。'); 
      return; 
    }
    
    console.log("🚀 Dashboard 开始加载数据, ID:", id);

    fetch(`http://localhost:8000/api/students/${id}/state`)
      .then(res => {
        if (!res.ok) throw new Error('State API Error');
        return res.json();
      })
      .then(data => {
        console.log("✅ State 数据获取成功:", data);
        setState(data);
        
        return fetch(`http://localhost:8000/api/knowledge/points`).catch(() => {
          console.log("⚠️ 知识点接口未就绪，跳过加载");
          return null;
        });
      })
      .then(res => {
        if (res && res.ok) {
          return res.json();
        }
        return [];
      })
      .then(data => {
        if (Array.isArray(data)) {
          setKnowledgeList(data);
        }
        setKnowledgeLoading(false);
      })
      .catch(e => {
        console.error("加载过程出错:", e);
        setKnowledgeLoading(false);
      });
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  if (error) return <div className="min-h-screen flex items-center justify-center text-red-400 font-serif-cn">{error}</div>;
  if (!state) return <div className="min-h-screen flex items-center justify-center text-slate-400 font-serif-cn text-2xl animate-pulse">正在连接学习宇宙...</div>;

  const funnel = state.funnel || {};
  const profile = state.profile || {};
  const badges = [profile.grade, ...(profile.interests || []), ...(profile.goals || [])].filter(Boolean) as string[];
  const currentGrade = profile.grade || '未知年级';

  return (
    <>
      {/* 极光背景 */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-600/10 rounded-full blur-[100px] animate-[float_25s_infinite_ease-in-out_alternate]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-cyan-600/10 rounded-full blur-[100px] animate-[float_25s_infinite_ease-in-out_alternate_5s]" />
      </div>

      <div className="min-h-screen p-8 md:p-12 max-w-5xl mx-auto space-y-8 animate-[slideUpFade_0.8s_ease-out_forwards]">
        
        {/* 顶部标题与控制区 */}
        <div className="flex items-start justify-between mb-12">
          <div className="space-y-2">
            <h1 className="text-5xl font-serif-cn font-bold text-white tracking-tight">欢迎回来，探索者</h1>
            <p className="text-slate-400 text-lg font-light">你的学习路径正在稳步延伸。</p>
          </div>
          
          <button
            onClick={() => {
              if (window.confirm('确定要清除当前进度，开启一段新的探索旅程吗？')) {
                localStorage.removeItem('pw_student_id');
                window.location.href = '/';
              }
            }}
            className="group flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-indigo-500/50 transition-all duration-300 backdrop-blur-md"
          >
            <span className="text-lg group-hover:rotate-180 transition-transform duration-500">🔄</span>
            <span className="text-sm font-medium text-slate-300 group-hover:text-white">开启新探索</span>
          </button>
        </div>

        {/* 1. Hero Card：职业目标 (带鼠标跟踪光晕) */}
        <div 
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          className="group relative overflow-hidden glass-card p-10 min-h-[200px] flex items-center justify-between cursor-default card-shine transition-all duration-500 hover:border-indigo-500/30 hover:shadow-[0_0_30px_rgba(99,102,241,0.1)]"
        >
          <div 
            className="absolute pointer-events-none transition-all duration-500 ease-out"
            style={{
              background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(99, 102, 241, 0.15), transparent 40%)`,
              opacity: isHovering ? 1 : 0,
            }}
          />
          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-2xl opacity-0 group-hover:opacity-20 transition duration-500 blur" />
          
          <div className="relative z-10 space-y-2">
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">当前职业目标</h2>
            {state.selected_career ? (
              <div className="text-4xl font-serif-cn font-bold text-white">
                {state.selected_career.replace(/_/g, ' ').toUpperCase()}
              </div>
            ) : (
              <div className="text-2xl text-slate-500">尚未选择职业方向</div>
            )}
            <p className="text-slate-400 font-light max-w-md">你的学习路径将围绕此方向展开，AI 会为你定制专属内容。</p>
          </div>

          <div className="relative z-10 hidden md:flex items-center justify-center w-20 h-20 rounded-2xl bg-white/5 border border-white/10 group-hover:border-indigo-500/30 transition-all duration-500">
             <span className={`text-4xl transition-all duration-500 ${isHovering ? 'scale-110 drop-shadow-[0_0_10px_rgba(99,102,241,0.8)]' : 'grayscale opacity-50'}`}>
               💼
             </span>
          </div>
        </div>

        {/* 2. 漏斗状态：垂直互动时间轴 */}
        <div className="group glass-card p-8 card-shine transition-all duration-500 hover:border-indigo-500/30 relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-2xl opacity-0 group-hover:opacity-10 transition duration-500 blur pointer-events-none" />
          
          <h3 className="text-xl font-serif-cn font-medium text-white mb-8 relative z-10">学习路径进度</h3>
          <div className="relative space-y-8 pl-4">
            <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-800" />
            
            {FUNNEL_STEPS.map((step) => {
              const isDone = funnel[step.key] === true;
              return (
                <div key={step.key} className="relative flex items-center group/item">
                  <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                    isDone 
                      ? 'bg-indigo-600 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]' 
                      : 'bg-slate-900 border-slate-700 group-hover/item:border-slate-500'
                  }`}>
                    {isDone ? (
                      <span className="text-white text-lg font-bold">✓</span>
                    ) : (
                      <span className="text-slate-500 text-lg group-hover/item:text-slate-300">○</span>
                    )}
                  </div>
                  
                  <div className="ml-6 flex-1 flex items-center justify-between">
                    <div>
                      <div className={`text-lg font-medium transition-colors flex items-center gap-3 ${isDone ? 'text-white' : 'text-slate-400 group-hover/item:text-slate-200'}`}>
                        <span className="text-xl">{step.symbol}</span>
                        {step.label}
                      </div>
                      <div className="text-sm text-slate-500 ml-9">
                        {isDone ? '已完成' : '待解锁'}
                      </div>
                    </div>

                    {step.key === 'assessment_complete' && !isDone && (
                      <button 
                        onClick={() => window.location.href = '/assessment'}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-all shadow-lg mr-4"
                      >
                        开始评估 →
                      </button>
                    )}

                    {step.key === 'route_ready' && isDone && (
                      <button 
                        onClick={() => window.location.href = '/route'}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-sm font-bold rounded-lg transition-all shadow-[0_0_15px_rgba(99,102,241,0.4)] mr-4 animate-pulse"
                      >
                        查看我的专属路线 🚀
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. 画像标签与能力雷达图 (双栏布局) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 左侧：画像标签 */}
          <div className="group glass-card p-8 card-shine transition-all duration-500 hover:border-indigo-500/30 relative overflow-hidden">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-2xl opacity-0 group-hover:opacity-10 transition duration-500 blur pointer-events-none" />
            <h3 className="text-xl font-serif-cn font-medium text-white mb-6 relative z-10">个人画像标签</h3>
            <div className="flex gap-3 flex-wrap relative z-10">
              {badges.length > 0 ? badges.map(b => (
                <span key={b} className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-300 text-sm hover:border-indigo-500/50 hover:text-white hover:bg-indigo-600/10 transition-all cursor-default">
                  {b}
                </span>
              )) : <span className="text-slate-500 text-sm">暂无画像信息</span>}
            </div>
          </div>

          {/* 右侧：AI 能力雷达图 */}
          <div className="group glass-card p-8 relative overflow-hidden card-shine transition-all duration-500 hover:border-indigo-500/30">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-2xl opacity-0 group-hover:opacity-10 transition duration-500 blur pointer-events-none" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
            
            <h3 className="text-xl font-serif-cn font-medium text-white mb-2 relative z-10">AI 能力维度分析</h3>
            <p className="text-xs text-slate-500 mb-4 relative z-10">基于你的评估与画像生成</p>
            
            <div className="h-[250px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                  { subject: '逻辑推理', A: 85 },
                  { subject: '计算能力', A: 65 },
                  { subject: '空间想象', A: 70 },
                  { subject: '数据分析', A: 90 },
                  { subject: '抽象思维', A: 75 },
                ]}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="能力值" dataKey="A" stroke="#818cf8" fill="#6366f1" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* 4. 知识点大纲 (静默加载) */}
        {!knowledgeLoading && knowledgeList.length > 0 && (
          <div className="group glass-card p-8 space-y-8 card-shine transition-all duration-500 hover:border-indigo-500/30 relative overflow-hidden">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-2xl opacity-0 group-hover:opacity-10 transition duration-500 blur pointer-events-none" />
            <h2 className="text-2xl font-serif-cn font-bold text-white relative z-10">
              {currentGrade} 知识大纲 
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative z-10">
              {knowledgeList.slice(0, 4).map((item: any) => (
                <div key={item.id} className="p-4 bg-white/5 rounded-lg border border-white/5 hover:border-indigo-500/30 transition-all">
                  <div className="text-sm font-bold text-slate-300">[{item.chapter}] {item.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
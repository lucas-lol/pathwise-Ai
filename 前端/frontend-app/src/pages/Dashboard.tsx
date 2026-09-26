import { useState, useEffect, useRef } from 'react';

// 定义后端返回的状态数据结构
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

// 漏斗步骤定义
const FUNNEL_STEPS = [
  { key: 'profile_complete', label: '画像完成', symbol: '👤' },
  { key: 'assessment_complete', label: '评估完成', symbol: '📝' },
  { key: 'career_selected', label: '职业选择', symbol: '💼' },
  { key: 'route_ready', label: '路线就绪', symbol: '' },
];

export default function Dashboard() {
  const [state, setState] = useState<StateData | null>(null);
  const [error, setError] = useState('');
  
  // 知识点相关状态
  const [knowledgeList, setKnowledgeList] = useState<any[]>([]);
  const [knowledgeLoading, setKnowledgeLoading] = useState(true);

  // 鼠标光晕效果相关
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

    // 1. 获取核心状态 (State)
    fetch(`http://localhost:8000/api/students/${id}/state`)
      .then(res => {
        if (!res.ok) throw new Error('State API Error');
        return res.json();
      })
      .then(data => {
        console.log("✅ State 数据获取成功:", data);
        setState(data);
        
        // 2. 尝试获取知识点 (即使失败也不影响主流程)
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
  // 收集所有标签
  const badges = [profile.grade, ...(profile.interests || []), ...(profile.goals || [])].filter(Boolean) as string[];
  const currentGrade = profile.grade || '未知年级';

  return (
    <>
      {/* 极光背景 */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-600/10 rounded-full blur-[100px] animate-[float_25s_infinite_ease-in-out_alternate]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-cyan-600/10 rounded-full blur-[100px] animate-[float_25s_infinite_ease-in-out_alternate_5s]" />
      </div>

      <div className="min-h-screen p-8 md:p-12 max-w-5xl mx-auto space-y-12 animate-[slideUpFade_0.8s_ease-out_forwards]">
        
        {/* 顶部标题与控制区 */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-5xl font-serif-cn font-bold text-white tracking-tight">欢迎回来，探索者</h1>
            <p className="text-slate-400 text-lg font-light">你的学习路径正在稳步延伸。</p>
          </div>
          
          {/* 开启新探索按钮 */}
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

        {/* 1. Hero Card：职业目标 */}
        <div 
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          className="relative overflow-hidden glass-card p-10 min-h-[200px] flex items-center justify-between group cursor-default"
        >
          <div 
            className="absolute pointer-events-none transition-all duration-500 ease-out"
            style={{
              background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(99, 102, 241, 0.15), transparent 40%)`,
              opacity: isHovering ? 1 : 0,
            }}
          />
          
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

          <div className="relative z-10 hidden md:flex items-center justify-center w-20 h-20 rounded-2xl bg-white/5 border border-white/10">
             <span className={`text-4xl transition-all duration-500 ${isHovering ? 'scale-110 drop-shadow-[0_0_10px_rgba(99,102,241,0.8)]' : 'grayscale opacity-50'}`}>
               💼
             </span>
          </div>
        </div>

        {/* 2. 漏斗状态：垂直互动时间轴 */}
        <div className="glass-card p-8">
          <h3 className="text-xl font-serif-cn font-medium text-white mb-8">学习路径进度</h3>
          <div className="relative space-y-8 pl-4">
            <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-800" />
            
            {FUNNEL_STEPS.map((step) => {
              const isDone = funnel[step.key] === true; // 严格判断 boolean
              return (
                <div key={step.key} className="relative flex items-center group">
                  <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                    isDone 
                      ? 'bg-indigo-600 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]' 
                      : 'bg-slate-900 border-slate-700'
                  }`}>
                    {isDone ? (
                      <span className="text-white text-lg font-bold">✓</span>
                    ) : (
                      <span className="text-slate-500 text-lg">○</span>
                    )}
                  </div>
                  
                  <div className="ml-6 flex-1 flex items-center justify-between">
                    <div>
                      <div className={`text-lg font-medium transition-colors flex items-center gap-3 ${isDone ? 'text-white' : 'text-slate-400'}`}>
                        <span className="text-xl">{step.symbol}</span>
                        {step.label}
                      </div>
                      <div className="text-sm text-slate-500 ml-9">
                        {isDone ? '已完成' : '待解锁'}
                      </div>
                    </div>

                    {/* 评估完成按钮 */}
                    {step.key === 'assessment_complete' && !isDone && (
                      <button 
                        onClick={() => window.location.href = '/assessment'}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-all shadow-lg mr-4"
                      >
                        开始评估 →
                      </button>
                    )}

                    {/* 路线就绪按钮 */}
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

        {/* 3. 画像标签 */}
        <div className="glass-card p-8">
          <h3 className="text-xl font-serif-cn font-medium text-white mb-6">个人画像标签</h3>
          <div className="flex gap-3 flex-wrap">
            {badges.length > 0 ? badges.map(b => (
              <span key={b} className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-300 text-sm hover:border-indigo-500/50 hover:text-white transition-all cursor-default">
                {b}
              </span>
            )) : <span className="text-slate-500 text-sm">暂无画像信息，请完成前置步骤。</span>}
          </div>
        </div>

        {/* 4. 知识点大纲 (静默加载) */}
        {!knowledgeLoading && knowledgeList.length > 0 && (
          <div className="glass-card p-8 space-y-8">
            <h2 className="text-2xl font-serif-cn font-bold text-white">
              {currentGrade} 知识大纲 
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {knowledgeList.slice(0, 4).map((item: any) => (
                <div key={item.id} className="p-4 bg-white/5 rounded-lg border border-white/5">
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
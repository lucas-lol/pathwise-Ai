import { useState, useEffect, useRef } from 'react';

interface StateData {
  funnel: Record<string, boolean>;
  profile?: { grade?: string; interests?: string[]; goals?: string[] };
  selected_career?: string;
  mastery?: Record<string, number>;
}

const FUNNEL_STEPS = [
  { key: 'profile_complete', label: '画像完成', symbol: '👤' },
  { key: 'assessment_complete', label: '评估完成', symbol: '' },
  { key: 'career_selected', label: '职业选择', symbol: '💼' },
  { key: 'route_ready', label: '路线就绪', symbol: '🚀' },
];

export default function Dashboard() {
  const [state, setState] = useState<StateData | null>(null);
  const [error, setError] = useState('');
  
  // 知识点相关状态
  const [knowledgeList, setKnowledgeList] = useState<any[]>([]);
  const [knowledgeLoading, setKnowledgeLoading] = useState(true);

  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    // 1. 获取学生状态
    const id = localStorage.getItem('pw_student_id');
    if (!id) { setError('未找到学号，请先完成画像。'); return; }
    
    fetch(`http://localhost:8000/api/students/${id}/state`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
      .then(data => {
        setState(data);
        
        // 2. 状态获取成功后，获取知识点 (MVP 极速版：直接读取 JSON)
        const currentGrade = data?.profile?.grade || '初一';
        return fetch(`http://localhost:8000/api/knowledge/points`);
      })
      .then(r => r ? r.json() : null)
      .then(data => {
        if (data) {
          setKnowledgeList(data);
          setKnowledgeLoading(false);
        }
      })
      .catch(e => {
        console.error(e);
        // 如果知识点获取失败，不阻塞主界面，只记录错误
        setKnowledgeLoading(false);
        if (!state) setError('加载状态失败：' + e.message);
      });
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  if (error) return <div className="min-h-screen flex items-center justify-center text-red-400 font-serif-cn">{error}</div>;
  if (!state) return <div className="min-h-screen flex items-center justify-center text-slate-400 font-serif-cn text-2xl animate-pulse">正在连接学习宇宙...</div>;

  const funnel = state.funnel;
  const profile = state.profile || {};
  const badges = [profile.grade, ...(profile.interests || []), ...(profile.goals || [])].filter(Boolean) as string[];
  const currentGrade = profile.grade || '初一';

  return (
    <>
      {/* 极光背景 */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-600/10 rounded-full blur-[100px] animate-[float_25s_infinite_ease-in-out_alternate]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-cyan-600/10 rounded-full blur-[100px] animate-[float_25s_infinite_ease-in-out_alternate_5s]" />
      </div>

      <div className="min-h-screen p-8 md:p-12 max-w-5xl mx-auto space-y-12 animate-[slideUpFade_0.8s_ease-out_forwards]">
        
        {/* 顶部标题 */}
        <div className="space-y-2">
          <h1 className="text-5xl font-serif-cn font-bold text-white tracking-tight">欢迎回来，探索者</h1>
          <p className="text-slate-400 text-lg font-light">你的学习路径正在稳步延伸。</p>
        </div>

        {/* 1. Hero Card：职业目标 (带鼠标跟踪光晕) */}
        <div 
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          className="relative overflow-hidden glass-card p-10 min-h-[200px] flex items-center justify-between group cursor-default"
        >
          {/* 鼠标跟踪光晕层 */}
          <div 
            className="absolute pointer-events-none transition-all duration-500 ease-out"
            style={{
              background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(99, 102, 241, 0.15), transparent 40%)`,
              opacity: isHovering ? 1 : 0,
              transform: isHovering ? 'scale(1)' : 'scale(0.8)',
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

          {/* 纯 CSS 图标容器 */}
          <div className="relative z-10 hidden md:flex items-center justify-center w-20 h-20 rounded-2xl bg-white/5 border border-white/10">
             <span className={`text-4xl transition-all duration-500 ${isHovering ? 'scale-110 drop-shadow-[0_0_10px_rgba(99,102,241,0.8)]' : 'grayscale opacity-50'}`}>
               
             </span>
          </div>
        </div>

        {/* 2. 漏斗状态：垂直互动时间轴 */}
        <div className="glass-card p-8">
          <h3 className="text-xl font-serif-cn font-medium text-white mb-8">学习路径进度</h3>
          <div className="relative space-y-8 pl-4">
            {/* 背景连线 */}
            <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-800" />
            
            {FUNNEL_STEPS.map((step, index) => {
              const isDone = funnel?.[step.key];
              return (
                <div key={step.key} className="relative flex items-center group">
                  {/* 节点 */}
                  <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                    isDone 
                      ? 'bg-indigo-600 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]' 
                      : 'bg-slate-900 border-slate-700 group-hover:border-slate-500'
                  }`}>
                    {isDone ? (
                      <span className="text-white text-lg font-bold">✓</span>
                    ) : (
                      <span className="text-slate-500 text-lg group-hover:text-slate-300">○</span>
                    )}
                  </div>
                  
                  {/* 内容 */}
                  <div className="ml-6 flex-1">
                    <div className={`text-lg font-medium transition-colors flex items-center gap-3 ${isDone ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                      <span className="text-xl">{step.symbol}</span>
                      {step.label}
                    </div>
                    <div className="text-sm text-slate-500 ml-9">
                      {isDone ? '已完成' : '待解锁'}
                    </div>
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
            {badges.length ? badges.map(b => (
              <span key={b} className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-300 text-sm hover:border-indigo-500/50 hover:text-white transition-all cursor-default">
                {b}
              </span>
            )) : <span className="text-slate-500 text-sm">暂无画像信息</span>}
          </div>
        </div>

        {/* 4. 真实知识点大纲 (按领域分组) */}
        {!knowledgeLoading && knowledgeList.length > 0 && (
          <div className="glass-card p-8 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-serif-cn font-bold text-white">
                {currentGrade} 知识大纲 
                <span className="text-sm text-slate-500 ml-2 font-sans font-normal">
                  (共 {knowledgeList.filter(k => k.grade === currentGrade).length} 个核心知识点)
                </span>
              </h2>
            </div>
            
            {/* 按 domain (领域) 分组展示 */}
            {Object.entries(
              knowledgeList
                .filter(item => item.grade === currentGrade)
                .reduce((acc, item) => {
                  const domain = item.domain || '其他';
                  if (!acc[domain]) acc[domain] = [];
                  acc[domain].push(item);
                  return acc;
                }, {} as Record<string, any[]>)
            ).map(([domain, items]) => (
              <div key={domain} className="space-y-4">
                <h3 className="text-lg font-medium text-indigo-400 border-b border-white/5 pb-2">
                  {domain}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {items.map((item) => (
                    <div 
                      key={item.id} 
                      className="p-4 bg-white/5 rounded-lg border border-white/5 hover:border-indigo-500/30 transition-all group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">
                          [{item.chapter}] {item.name}
                        </span>
                        <div className="flex gap-1">
                          {/* 重要度星星 */}
                          {Array.from({ length: item.importance }).map((_, i) => (
                            <span key={`imp-${i}`} className="text-amber-400 text-xs">★</span>
                          ))}
                        </div>
                      </div>
                      {item.formula && (
                        <div className="text-xs text-slate-500 bg-black/20 p-2 rounded mt-2 font-mono">
                          💡 {item.formula}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
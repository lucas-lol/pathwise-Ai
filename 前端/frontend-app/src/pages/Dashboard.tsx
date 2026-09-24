import { useState, useEffect, useRef } from 'react';

interface StateData {
  funnel: Record<string, boolean>;
  profile?: { grade?: string; interests?: string[]; goals?: string[] };
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
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const id = localStorage.getItem('pw_student_id');
    if (!id) { setError('未找到学号'); return; }
    fetch(`http://localhost:8000/api/students/${id}/state`)
      .then(r => r.ok ? r.json() : Promise.reject('Error'))
      .then(setState)
      .catch(e => setError('加载失败'));
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  if (error) return <div style={{color: 'red', padding: 50}}>{error}</div>;
  if (!state) return <div style={{color: 'white', padding: 50, fontSize: 20}}>加载中...</div>;

  const funnel = state.funnel;
  const profile = state.profile || {};
  const badges = [profile.grade, ...(profile.interests || [])].filter(Boolean) as string[];

  return (
    <>
      {/* 极光背景层 */}
      <div className="aurora-background" />

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '60px 20px' }}>
        
        {/* 标题 */}
        <h1 className="font-title" style={{ fontSize: 48, color: 'white', marginBottom: 10 }}>欢迎回来，探索者</h1>
        <p style={{ color: '#94a3b8', fontSize: 18, marginBottom: 60 }}>你的学习路径正在稳步延伸。</p>

        {/* 1. Hero Card (鼠标跟踪) */}
        <div 
          ref={cardRef}
          onMouseMove={handleMouseMove}
          className="glass-card"
          style={{ position: 'relative', overflow: 'hidden', minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          {/* 光晕层 */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(99,102,241,0.15), transparent 40%)`,
            pointerEvents: 'none', transition: 'opacity 0.3s'
          }} />
          
          <div style={{ position: 'relative', zIndex: 10 }}>
            <div style={{ color: '#94a3b8', fontSize: 12, letterSpacing: 2, marginBottom: 10 }}>当前职业目标</div>
            <div className="font-title" style={{ fontSize: 36, color: 'white', marginBottom: 10 }}>
              {state.selected_career ? state.selected_career.replace('_', ' ').toUpperCase() : '未选择'}
            </div>
            <p style={{ color: '#94a3b8', maxWidth: 400 }}>你的学习路径将围绕此方向展开，AI 会为你定制专属内容。</p>
          </div>
          <div style={{ fontSize: 60, opacity: 0.8 }}>💼</div>
        </div>

        {/* 2. 漏斗进度 (垂直时间轴) */}
        <div className="glass-card">
          <h3 className="font-title" style={{ fontSize: 24, color: 'white', marginBottom: 30 }}>学习路径进度</h3>
          <div style={{ position: 'relative', paddingLeft: 20 }}>
            {/* 连线 */}
            <div style={{ position: 'absolute', left: 35, top: 10, bottom: 10, width: 2, background: '#1e293b' }} />
            
            {FUNNEL_STEPS.map((step) => {
              const isDone = funnel?.[step.key];
              return (
                <div key={step.key} style={{ display: 'flex', alignItems: 'center', marginBottom: 30, position: 'relative' }}>
                  {/* 节点圆圈 */}
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: isDone ? '#4f46e5' : '#0f172a',
                    border: `2px solid ${isDone ? '#6366f1' : '#334155'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, zIndex: 10,
                    boxShadow: isDone ? '0 0 15px rgba(99,102,241,0.5)' : 'none'
                  }}>
                    {isDone ? '✓' : step.symbol}
                  </div>
                  {/* 文字 */}
                  <div style={{ marginLeft: 20 }}>
                    <div style={{ fontSize: 18, color: isDone ? 'white' : '#94a3b8', fontWeight: 500 }}>{step.label}</div>
                    <div style={{ fontSize: 14, color: '#64748b' }}>{isDone ? '已完成' : '待解锁'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. 掌握度 (渐变进度条) */}
        {state?.mastery && Object.keys(state.mastery).length > 0 && (
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
              <h3 className="font-title" style={{ fontSize: 24, color: 'white' }}>知识点掌握度</h3>
              <span style={{ color: '#64748b', fontSize: 12 }}>实时数据</span>
            </div>
            
            {Object.entries(state.mastery).map(([key, value]) => {
              const percent = (value * 100).toFixed(0);
              let color = '#ef4444'; // 红
              let label = '需努力';
              if (value >= 0.7) { color = '#10b981'; label = '已掌握'; } // 绿
              else if (value >= 0.4) { color = '#f59e0b'; label = '进行中'; } // 黄

              return (
                <div key={key} style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: '#e2e8f0', fontSize: 16, textTransform: 'capitalize' }}>{key.replace(/-/g, ' ')}</span>
                    <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
                      <span style={{ color: color, fontSize: 12, fontWeight: 'bold' }}>{label}</span>
                      <span className="font-title" style={{ color: 'white', fontSize: 20 }}>{percent}%</span>
                    </div>
                  </div>
                  {/* 进度条 */}
                  <div className="progress-track">
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${percent}%`, 
                        background: `linear-gradient(90deg, ${color}, #fff)`,
                        color: color 
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </>
  );
}
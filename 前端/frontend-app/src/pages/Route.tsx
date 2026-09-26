import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RoutePage() {
  const [routeData, setRouteData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const studentId = localStorage.getItem('pw_student_id');

  useEffect(() => {
    if (!studentId) { navigate('/'); return; }
    
    fetch(`http://localhost:8000/api/students/${studentId}/route`)
      .then(res => res.json())
      .then(data => {
        setRouteData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [studentId, navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400 animate-pulse">正在规划专属路线...</div>;
  if (!routeData) return <div className="min-h-screen flex items-center justify-center text-red-400">加载路线失败</div>;

  return (
    <>
      <div className="aurora-background" />
      <div className="min-h-screen p-8 md:p-12 max-w-4xl mx-auto space-y-10 animate-[slideUpFade_0.8s_ease-out_forwards] relative z-10">
        
        {/* 顶部返回与标题 */}
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-white transition-colors flex items-center gap-2">
            ← 返回仪表盘
          </button>
          <div className="text-right">
            <h1 className="text-3xl font-serif-cn font-bold text-white">{routeData.target_career}</h1>
            <p className="text-slate-400 text-sm mt-1">{routeData.grade} · 专属成长路径</p>
          </div>
        </div>

        {/* 路线时间轴 */}
        <div className="relative space-y-12 pl-8">
          {/* 贯穿的时间线 */}
          <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-indigo-500 via-cyan-500 to-transparent opacity-30" />

          {routeData.phases.map((phase: any) => (
            <div key={phase.id} className="relative group">
              {/* 节点圆点 */}
              <div className="absolute -left-[29px] top-6 w-6 h-6 rounded-full bg-slate-900 border-2 border-indigo-500 flex items-center justify-center shadow-[0_0_10px_rgba(99,102,241,0.5)]">
                <div className="w-2 h-2 bg-indigo-400 rounded-full" />
              </div>

              {/* 阶段卡片 */}
              <div className="glass-card p-8 space-y-6 hover:border-indigo-500/30 transition-all duration-300">
                <div>
                  <h2 className="text-2xl font-serif-cn font-bold text-white mb-2">{phase.name}</h2>
                  <p className="text-slate-400 text-sm">{phase.description}</p>
                </div>

                {/* 任务列表 */}
                <div className="space-y-3">
                  {phase.tasks.map((task: any) => (
                    <div 
                      key={task.id} 
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                        task.status === 'ready' 
                          ? 'bg-indigo-600/10 border-indigo-500/50 hover:bg-indigo-600/20 cursor-pointer' 
                          : 'bg-white/5 border-white/5 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className={`text-2xl ${task.status === 'ready' ? 'grayscale-0' : 'grayscale opacity-50'}`}>
                          {task.type === 'quiz' ? '📝' : task.type === 'video' ? '🎬' : task.type === 'article' ? '📖' : '💻'}
                        </span>
                        <div>
                          <div className={`font-medium ${task.status === 'ready' ? 'text-white' : 'text-slate-500'}`}>
                            {task.title}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">{task.desc}</div>
                        </div>
                      </div>
                      
                      {task.status === 'ready' && (
                        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors">
                          开始
                        </button>
                      )}
                      {task.status === 'locked' && (
                        <span className="text-xs text-slate-600 flex items-center gap-1">
                          🔒 前置任务未完成
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
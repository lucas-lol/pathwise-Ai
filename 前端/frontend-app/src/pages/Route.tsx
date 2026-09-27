// src/pages/Route.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AILoading from '../components/AILoading';
import StageSection from '../components/StageSection';
import { API_BASE_URL } from '../config';

export default function RoutePage() {
  const [routeData, setRouteData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAiThink, setShowAiThink] = useState(true);
  const navigate = useNavigate();
  const studentId = localStorage.getItem('pw_student_id');

  useEffect(() => {
    if (!studentId) { navigate('/'); return; }
    
    // 保留你原本优秀的 AI 思考动画逻辑
    const timer = setTimeout(() => {
      fetch(`${API_BASE_URL}/api/students/${studentId}/route`)
        .then(res => {
          if (!res.ok) throw new Error('Backend not ready');
          return res.json();
        })
        .then(data => {
          // 👇 数据适配：将后端可能返回的 'ready' 状态映射为我们新组件的 'available'
          const adaptedData = {
            ...data,
            phases: data.phases?.map((phase: any) => ({
              ...phase,
              tasks: phase.tasks.map((task: any) => ({
                ...task,
                status: task.status === 'ready' ? 'available' : task.status,
                type: task.type || 'note' // 兜底类型
              }))
            }))
          };
          setRouteData(adaptedData);
          setLoading(false);
          setShowAiThink(false);
        })
        .catch(err => {
          console.warn("后端未就绪，启用本地 Mock 路线数据演示", err);
          // 👇 降级方案：如果后端没数据，使用我们之前设计的精美 Mock 数据保证演示流程
          setRouteData({
            target_career: localStorage.getItem('pw_career') || 'AI 算法工程师',
            grade: localStorage.getItem('pw_grade') || '高一',
            phases: [
              {
                id: 'phase_1',
                name: '阶段一：夯实学科基础',
                description: '构建坚实的知识体系，为职业发展打下底层逻辑。',
                tasks: [
                  { id: 't1_1', type: 'quiz', title: '核心基础巩固', desc: '10道基础概念题，夯实学科根基', status: 'available', estimatedTime: '20分钟' },
                  { id: 't1_2', type: 'note', title: '核心概念精要', desc: '本阶段必考知识点梳理', status: 'locked', estimatedTime: '15分钟' },
                  { id: 't1_3', type: 'project', title: 'Mini 项目实战', desc: '独立完成一个小型综合项目', status: 'locked', estimatedTime: '3天' }
                ]
              },
              {
                id: 'phase_2',
                name: '阶段二：职业启蒙与探索',
                description: '认知行业全貌，规划长远发展路径。',
                tasks: [
                  { id: 't2_1', type: 'note', title: '职业发展路径图', desc: '从入门到资深的晋升路线', status: 'locked', estimatedTime: '10分钟' }
                ]
              }
            ]
          });
          setLoading(false);
          setShowAiThink(false);
        });
    }, 2500);

    return () => clearTimeout(timer);
  }, [studentId, navigate]);

  // 👇 核心交互逻辑：处理任务完成与解锁
  const handleTaskComplete = (completedTaskId: string) => {
    if (!routeData) return;

    // 深度复制当前状态，避免直接修改原对象 (React 最佳实践)
    const newRouteData = JSON.parse(JSON.stringify(routeData));
    let foundCurrent = false;

    for (let i = 0; i < newRouteData.phases.length; i++) {
      const phase = newRouteData.phases[i];
      for (let j = 0; j < phase.tasks.length; j++) {
        const task = phase.tasks[j];

        if (foundCurrent) {
          // 如果找到了上一个完成的任务，那么当前这个任务就是“下一个”，将其解锁！
          if (task.status === 'locked') {
            task.status = 'available';
          }
          foundCurrent = false; // 重置标记，避免连续解锁
          break; 
        }

        if (task.id === completedTaskId) {
          // 标记当前任务为已完成
          task.status = 'completed';
          foundCurrent = true; // 设置标记，准备解锁下一个
        }
      }
    }

    // 更新 State，触发页面重新渲染，UI 会瞬间响应（节点变绿，下一个解锁）
    setRouteData(newRouteData);
    
    // (可选) 可以在这里加一个 toast 提示："🎉 任务完成！已解锁新内容"
    console.log(`任务 ${completedTaskId} 已完成，状态已更新`);
  };

  // 1. 如果正在“AI 思考”，直接全屏展示炫酷动画
  if (showAiThink) {
    return <AILoading />;
  }

  // 2. 常规加载状态
  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400 animate-pulse">正在规划专属路线...</div>;
  
  // 3. 错误状态
  if (!routeData) return <div className="min-h-screen flex items-center justify-center text-red-400">加载路线失败</div>;

  // 4. 正式展示路线 (使用我们新开发的高级组件)
  return (
    <>
      <div className="aurora-background" />
      <div className="min-h-screen p-8 md:p-12 max-w-4xl mx-auto space-y-10 animate-[slideUpFade_0.8s_ease-out_forwards] relative z-10">
        
        {/* 顶部返回与标题 */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 group">
            <span className="group-hover:-translate-x-1 transition-transform">←</span> 返回仪表盘
          </button>
          <div className="text-right">
            <h1 className="text-3xl font-serif font-bold text-white">{routeData.target_career}</h1>
            <p className="text-slate-400 text-sm mt-1">{routeData.grade} · 专属成长路径</p>
          </div>
        </div>

        {/* 👇 使用全新的 StageSection 组件渲染时间轴 */}
        <div className="space-y-16">
          {routeData.phases.map((phase: any) => (
            <StageSection
              key={phase.id}
              stageTitle={phase.name}
              stageDescription={phase.description}
              tasks={phase.tasks}
              onTaskComplete={handleTaskComplete} // 传递解锁回调
            />
          ))}
        </div>

      </div>
    </>
  );
}
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
  
  // 👇 监控 1：检查学号
  const studentId = localStorage.getItem('pw_student_id');
  const userGrade = localStorage.getItem('pw_grade');
  
  console.log("🔍 [Route] 当前 localStorage 中的 studentId:", studentId);
  console.log("🔍 [Route] 当前 localStorage 中的 grade:", userGrade);

  useEffect(() => {
    if (!studentId) { navigate('/'); return; }
    
    const timer = setTimeout(() => {
      console.log("🔍 [Route] 开始请求后端 API...");
      
      fetch(`${API_BASE_URL}/api/students/${studentId}/route`)
        .then(res => {
          if (!res.ok) throw new Error(`Backend returned ${res.status}`);
          return res.json();
        })
        .then(data => {
          // 👇 监控 2：如果后端成功了，打印后端返回的数据！
          console.log("✅ [Route] 后端 API 请求成功！后端返回的数据:", data);
          
          const adaptedData = {
            ...data,
            phases: data.phases?.map((phase: any) => ({
              ...phase,
              tasks: phase.tasks.map((task: any) => ({
                ...task,
                status: task.status === 'ready' ? 'available' : task.status,
                type: task.type?.toLowerCase() || 'article'
              }))
            }))
          };
          setRouteData(adaptedData);
          setLoading(false);
          setShowAiThink(false);
        })
        .catch(err => {
          // 👇 监控 3：如果后端失败了，打印错误，并执行前端 Mock
          console.warn("⚠️ [Route] 后端 API 请求失败，启用前端 Mock 数据。原因:", err);
          
          const gradeToUse = userGrade || '高一';
          console.log(`🔍 [Route] 准备生成 Mock 题目，使用的年级是: ${gradeToUse}`);
          
          let mockQuestions = [];
          if (gradeToUse === '初一') {
            mockQuestions = [{ 
              question: "几何基础：两点之间，什么最短？", 
              options: [{id:'A', text:'直线'}, {id:'B', text:'线段'}, {id:'C', text:'射线'}, {id:'D', text:'曲线'}], 
              correctAnswer: 'B' 
            }];
          } else if (gradeToUse === '高一') {
            mockQuestions = [{ 
              question: "集合运算：已知集合 A = {x | x² - 3x + 2 = 0}, B = {1, 2, 3}, 则 A ∩ B = ?", 
              options: [{id:'A', text:'{1}'}, {id:'B', text:'{2}'}, {id:'C', text:'{1, 2}'}, {id:'D', text:'{1, 2, 3}'}], 
              correctAnswer: 'C' 
            }];
          } else {
            mockQuestions = [{ 
              question: `【${gradeToUse}微积分挑战】极限 lim(x→0) sin(x)/x 的值是？`, 
              options: [{id:'A', text:'0'}, {id:'B', text:'1'}, {id:'C', text:'∞'}, {id:'D', text:'不存在'}], 
              correctAnswer: 'B' 
            }];
          }
          
          console.log("🔍 [Route] 最终生成的 Mock 题目数据:", mockQuestions);

          setRouteData({
            target_career: localStorage.getItem('pw_career') || 'AI 算法工程师',
            grade: gradeToUse,
            phases: [
              {
                id: 'phase_1', 
                name: '阶段一：夯实学科基础', 
                description: `针对 ${gradeToUse} 学科特点，进行定制化思维训练。`,
                tasks: [
                  { 
                    id: 't1_1', type: 'quiz', title: `${gradeToUse} 核心基础巩固`, desc: '动态生成的专属概念题', 
                    status: 'available', estimatedTime: '5分钟', content: { questions: mockQuestions } 
                  },
                  { 
                    id: 't1_2', type: 'video', title: '观看：知识点本质解析', desc: '名师讲解', 
                    status: 'locked', estimatedTime: '15分钟', content: { videoUrl: 'https://example.com' } 
                  }
                ]
              }
            ]
          });
          setLoading(false);
          setShowAiThink(false);
        });
    }, 2500);
    
    return () => clearTimeout(timer);
  }, [studentId, navigate, userGrade]);

  const handleTaskComplete = (completedTaskId: string) => {
    if (!routeData) return;
    const newRouteData = JSON.parse(JSON.stringify(routeData));
    let foundCurrent = false;
    for (let i = 0; i < newRouteData.phases.length; i++) {
      const phase = newRouteData.phases[i];
      for (let j = 0; j < phase.tasks.length; j++) {
        const task = phase.tasks[j];
        if (foundCurrent) {
          if (task.status === 'locked') task.status = 'available';
          foundCurrent = false; break; 
        }
        if (task.id === completedTaskId) {
          task.status = 'completed';
          foundCurrent = true;
        }
      }
    }
    setRouteData(newRouteData);
  };

  if (showAiThink) return <AILoading />;
  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">AI 规划中...</div>;
  if (!routeData) return <div className="min-h-screen flex items-center justify-center text-red-400">加载失败</div>;

  return (
    <>
      <div className="aurora-background" />
      <div className="min-h-screen p-8 md:p-12 max-w-4xl mx-auto space-y-10 animate-[slideUpFade_0.8s_ease-out_forwards] relative z-10">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-white flex items-center gap-2">← 返回仪表盘</button>
          <div className="text-right">
            <h1 className="text-3xl font-serif font-bold text-white">{routeData.target_career}</h1>
            <p className="text-slate-400 text-sm mt-1">{routeData.grade} · 专属成长路径</p>
          </div>
        </div>
        <div className="space-y-16">
          {routeData.phases.map((phase: any) => (
            <StageSection key={phase.id} stageTitle={phase.name} stageDescription={phase.description} tasks={phase.tasks} onTaskComplete={handleTaskComplete} />
          ))}
        </div>
      </div>
    </>
  );
}
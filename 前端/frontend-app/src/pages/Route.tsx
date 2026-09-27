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
    
    const timer = setTimeout(() => {
      fetch(`${API_BASE_URL}/api/students/${studentId}/route`)
        .then(res => {
          if (!res.ok) throw new Error('Backend not ready');
          return res.json();
        })
        .then(data => {
          // 适配后端可能返回的数据格式
          const adaptedData = {
            ...data,
            phases: data.phases?.map((phase: any) => ({
              ...phase,
              tasks: phase.tasks.map((task: any) => ({
                ...task,
                status: task.status === 'ready' ? 'available' : task.status,
                type: task.type?.toLowerCase() || 'article' // 确保类型是小写
              }))
            }))
          };
          setRouteData(adaptedData);
          setLoading(false);
          setShowAiThink(false);
        })
        .catch(err => {
          console.warn("后端未就绪，启用本地高质量 Mock 路线数据演示", err);
          
          // 👇 核心修复 1：根据用户真实年级，动态生成完全不同的题目
          const userGrade = localStorage.getItem('pw_grade') || '高一';
          let mockQuestions = [];
          
          if (userGrade === '初一') {
            mockQuestions = [{ 
              question: "几何基础：两点之间，什么最短？", 
              options: [{id:'A', text:'直线'}, {id:'B', text:'线段'}, {id:'C', text:'射线'}, {id:'D', text:'曲线'}], 
              correctAnswer: 'B' 
            }];
          } else if (userGrade === '高一') {
            mockQuestions = [{ 
              question: "集合运算：已知集合 A = {x | x² - 3x + 2 = 0}, B = {1, 2, 3}, 则 A ∩ B = ?", 
              options: [{id:'A', text:'{1}'}, {id:'B', text:'{2}'}, {id:'C', text:'{1, 2}'}, {id:'D', text:'{1, 2, 3}'}], 
              correctAnswer: 'C' 
            }];
          } else {
            mockQuestions = [{ 
              question: "微积分基础：极限 lim(x→0) sin(x)/x 的值是？", 
              options: [{id:'A', text:'0'}, {id:'B', text:'1'}, {id:'C', text:'∞'}, {id:'D', text:'不存在'}], 
              correctAnswer: 'B' 
            }];
          }

          // 👇 核心修复 2：确保 tasks 的 type 严格匹配 Renderer 支持的类型 ('quiz', 'video', 'article', 'project')
          setRouteData({
            target_career: localStorage.getItem('pw_career') || 'AI 算法工程师',
            grade: userGrade,
            phases: [
              {
                id: 'phase_1', 
                name: '阶段一：夯实学科基础', 
                description: `针对 ${userGrade} 学科特点，进行定制化思维训练。`,
                tasks: [
                  { 
                    id: 't1_1', 
                    type: 'quiz', // 匹配 QuizView
                    title: `${userGrade} 核心基础巩固`, 
                    desc: '动态生成的专属概念题，夯实学科根基', 
                    status: 'available', 
                    estimatedTime: '5分钟', 
                    content: { questions: mockQuestions } // 注入动态题目
                  },
                  { 
                    id: 't1_2', 
                    type: 'video', // 匹配 VideoView (不再是未知类型)
                    title: '观看：知识点本质解析', 
                    desc: '名师讲解核心概念，建立底层逻辑', 
                    status: 'locked', 
                    estimatedTime: '15分钟', 
                    content: { videoUrl: 'https://example.com/demo.mp4' } 
                  },
                  { 
                    id: 't1_3', 
                    type: 'project', // 匹配 ProjectView
                    title: 'Mini 项目实战', 
                    desc: '独立完成一个小型综合项目', 
                    status: 'locked', 
                    estimatedTime: '3天', 
                    content: { 
                      projectBrief: '设计并实现一个个人学习管理博客系统。', 
                      requirements: ['完成需求分析与原型设计', '实现前后端基础 CRUD', '部署至云端服务器'] 
                    } 
                  }
                ]
              },
              {
                id: 'phase_2', 
                name: '阶段二：职业启蒙与探索', 
                description: '认知行业全貌，规划长远发展路径。',
                tasks: [
                  { 
                    id: 't2_1', 
                    type: 'article', // 匹配 ArticleView
                    title: '职业发展路径图解析', 
                    desc: '从入门到资深的晋升路线图文指南', 
                    status: 'locked', 
                    estimatedTime: '10分钟', 
                    content: { 
                      text: '<h3 class="text-indigo-400 font-bold">初级阶段 (0-2年)</h3><p class="mb-4">掌握基础工具，在指导下完成分配的开发任务。</p><h3 class="text-indigo-400 font-bold">中级阶段 (2-4年)</h3><p class="mb-4">独立负责核心模块，具备解决复杂业务问题的能力。</p><h3 class="text-indigo-400 font-bold">高级/专家阶段 (5年+)</h3><p>负责系统架构设计、技术选型，并指导团队成长。</p>' 
                    } 
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
  }, [studentId, navigate]);

  // 👇 核心交互：前端本地状态更新，实现无缝解锁体验
  const handleTaskComplete = (completedTaskId: string) => {
    if (!routeData) return;
    
    const newRouteData = JSON.parse(JSON.stringify(routeData));
    let foundCurrent = false;
    
    for (let i = 0; i < newRouteData.phases.length; i++) {
      const phase = newRouteData.phases[i];
      for (let j = 0; j < phase.tasks.length; j++) {
        const task = phase.tasks[j];
        
        if (foundCurrent) {
          if (task.status === 'locked') {
            task.status = 'available'; // 解锁下一个任务
          }
          foundCurrent = false;
          break; 
        }
        
        if (task.id === completedTaskId) {
          task.status = 'completed'; // 标记当前为已完成
          foundCurrent = true;
        }
      }
    }
    
    setRouteData(newRouteData);
  };

  if (showAiThink) return <AILoading />;
  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400 animate-pulse">AI 正在规划专属路线...</div>;
  if (!routeData) return <div className="min-h-screen flex items-center justify-center text-red-400">加载路线失败，请重试</div>;

  return (
    <>
      <div className="aurora-background" />
      <div className="min-h-screen p-8 md:p-12 max-w-4xl mx-auto space-y-10 animate-[slideUpFade_0.8s_ease-out_forwards] relative z-10">
        
        {/* 顶部导航 */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 group">
            <span className="group-hover:-translate-x-1 transition-transform">←</span> 返回仪表盘
          </button>
          <div className="text-right">
            <h1 className="text-3xl font-serif font-bold text-white">{routeData.target_career}</h1>
            <p className="text-slate-400 text-sm mt-1">{routeData.grade} · 专属成长路径</p>
          </div>
        </div>

        {/* 渲染阶段与任务 */}
        <div className="space-y-16">
          {routeData.phases.map((phase: any) => (
            <StageSection 
              key={phase.id} 
              stageTitle={phase.name} 
              stageDescription={phase.description} 
              tasks={phase.tasks} 
              onTaskComplete={handleTaskComplete} 
            />
          ))}
        </div>
      </div>
    </>
  );
}
// src/components/StageSection.tsx
import { useState } from 'react';
import TaskNode from './TaskNode';
import TaskContentRenderer from './TaskContentRenderer';

interface SimpleTask {
  id: string;
  type: string;
  title: string;
  description: string;
  status: 'locked' | 'available' | 'completed';
  estimatedTime: string;
  content?: any;
}

interface StageSectionProps {
  stageTitle: string;
  stageDescription: string;
  tasks: SimpleTask[];
  onTaskComplete: (taskId: string) => void;
}

export default function StageSection({ stageTitle, stageDescription, tasks, onTaskComplete }: StageSectionProps) {
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const handleTaskClick = (taskId: string, status: string) => {
    if (status === 'locked') return;
    setExpandedTaskId(prev => (prev === taskId ? null : taskId));
  };

  // 包装回调，传入 taskId
  const handleComplete = (taskId: string) => {
    onTaskComplete(taskId);
    // 延迟收起面板，让用户看到“回答正确”的反馈
    setTimeout(() => {
      setExpandedTaskId(null);
    }, 800);
  };

  return (
    <div className="relative pl-8 md:pl-12 space-y-12">
      {/* 左侧垂直连接线 (Track) */}
      <div className="absolute left-[15px] md:left-[23px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500/50 via-slate-800 to-transparent"></div>

      {/* 阶段标题 */}
      <div className="relative mb-8">
        <div className="absolute -left-[29px] md:-left-[37px] top-1 w-4 h-4 rounded-full bg-slate-900 border-2 border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-wide">{stageTitle}</h2>
        <p className="text-slate-400 mt-2 text-sm md:text-base">{stageDescription}</p>
      </div>

      {/* 任务列表 */}
      <div className="space-y-6">
        {tasks.map((task) => (
          <div key={task.id} className="relative">
            {/* 任务节点连接线点 */}
            <div className={`absolute -left-[33px] md:-left-[41px] top-8 w-3 h-3 rounded-full border-2 transition-colors duration-300 ${
              task.status === 'completed' ? 'bg-emerald-500 border-emerald-400' :
              task.status === 'available' ? 'bg-indigo-500 border-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.6)]' :
              'bg-slate-800 border-slate-600'
            }`}></div>

            <TaskNode
              title={task.title}
              description={task.description}
              status={task.status}
              estimatedTime={task.estimatedTime}
              onClick={() => handleTaskClick(task.id, task.status)}
            />

            {/* 展开的内容面板 */}
            {expandedTaskId === task.id && (
              <div className="mt-4 ml-4 p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl animate-[slideUpFade_0.4s_ease-out_forwards]">
                {/*  智能渲染器：内部包含完成按钮 */}
                <TaskContentRenderer 
                  task={task} 
                  onTaskComplete={() => handleComplete(task.id)} 
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
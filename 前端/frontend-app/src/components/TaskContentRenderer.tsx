// src/components/TaskContentRenderer.tsx
import { useState } from 'react';

interface TaskContentRendererProps {
  task: any;
  onTaskComplete: () => void; // 👈 新增：任务完成回调
}

// 1. 答题视图 (Quiz) - 带判分逻辑
const QuizView = ({ task, onTaskComplete }: TaskContentRendererProps) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // 模拟题目数据 (实际应从 task.content 读取，这里为了演示写死)
  const questionData = task.content?.questions?.[0] || {
    question: "已知函数 f(x) = x² - 2x + 1，求 f(2) 的值。",
    options: [
      { id: 'A', text: '1' },
      { id: 'B', text: '2' },
      { id: 'C', text: '3' },
      { id: 'D', text: '4' }
    ],
    correctAnswer: 'A' // 👈 正确答案
  };

  const handleSubmit = () => {
    if (!selectedOption) return;
    
    setIsSubmitted(true);
    if (selectedOption === questionData.correctAnswer) {
      setIsCorrect(true);
      // 答对了，延迟 1 秒后自动触发完成，给用户看反馈的时间
      setTimeout(() => {
        onTaskComplete();
      }, 1000);
    } else {
      setIsCorrect(false);
    }
  };

  const handleRetry = () => {
    setSelectedOption(null);
    setIsSubmitted(false);
    setIsCorrect(false);
  };

  return (
    <div className="space-y-6">
      <h4 className="text-lg font-serif font-bold text-white mb-4">{questionData.question}</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {questionData.options.map((opt: any) => {
          // 判断选项样式：选中、正确、错误
          let optStyle = "bg-white/5 border-white/10 hover:bg-white/10";
          if (selectedOption === opt.id) {
            optStyle = isSubmitted 
              ? (isCorrect ? "bg-emerald-600/20 border-emerald-500" : "bg-red-600/20 border-red-500")
              : "bg-indigo-600/20 border-indigo-500";
          } else if (isSubmitted && opt.id === questionData.correctAnswer) {
            optStyle = "bg-emerald-600/20 border-emerald-500 opacity-80"; // 显示正确答案
          }

          return (
            <button
              key={opt.id}
              onClick={() => !isSubmitted && setSelectedOption(opt.id)}
              disabled={isSubmitted}
              className={`p-4 rounded-xl border text-left transition-all duration-300 ${optStyle} ${!isSubmitted ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full border mr-3 text-sm font-bold ${
                selectedOption === opt.id 
                  ? (isSubmitted ? (isCorrect ? "bg-emerald-500 border-emerald-400 text-white" : "bg-red-500 border-red-400 text-white") : "bg-indigo-500 border-indigo-400 text-white")
                  : "border-slate-600 text-slate-400"
              }`}>
                {opt.id}
              </span>
              <span className="text-slate-200">{opt.text}</span>
            </button>
          );
        })}
      </div>

      {/* 反馈区域 */}
      {isSubmitted && (
        <div className={`p-4 rounded-xl border ${isCorrect ? "bg-emerald-500/10 border-emerald-500/30" : "bg-red-500/10 border-red-500/30"} animate-[slideUpFade_0.3s_ease-out]`}>
          {isCorrect ? (
            <div className="flex items-center gap-2 text-emerald-400 font-medium">
              <span className="text-xl">✅</span> 回答正确！太棒了，即将解锁下一任务...
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-red-400 font-medium">
                <span className="text-xl">❌</span> 回答错误，正确答案是 {questionData.correctAnswer}。
              </div>
              <p className="text-slate-400 text-sm">解析：f(2) = 2² - 2*2 + 1 = 4 - 4 + 1 = 1。</p>
              <button 
                onClick={handleRetry}
                className="mt-2 px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors"
              >
                重新作答
              </button>
            </div>
          )}
        </div>
      )}

      {/* 提交按钮 (仅在未提交时显示) */}
      {!isSubmitted && (
        <div className="flex justify-end pt-4 border-t border-white/10">
          <button
            onClick={handleSubmit}
            disabled={!selectedOption}
            className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white font-medium rounded-lg transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] disabled:shadow-none"
          >
            提交答案
          </button>
        </div>
      )}
    </div>
  );
};

// 2. 笔记视图 (Note)
const NoteView = ({ task, onTaskComplete }: TaskContentRendererProps) => (
  <div className="prose prose-invert max-w-none space-y-6">
    <div>
      <h4 className="text-xl font-serif font-bold text-white mb-4">核心概念精要</h4>
      <div className="text-slate-300 leading-relaxed space-y-4">
        {task.content?.text ? (
          <div dangerouslySetInnerHTML={{ __html: task.content.text }} />
        ) : (
          <>
            <p>这里是关于该知识点的详细解析。通过结构化的排版，帮助学生快速抓住重点。</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-400">
              <li>概念一：解释说明...</li>
              <li>概念二：解释说明...</li>
            </ul>
          </>
        )}
        <p className="text-sm text-slate-500 mt-6 italic">💡 提示：建议结合错题本进行复习。</p>
      </div>
    </div>
    <div className="flex justify-end pt-4 border-t border-white/10">
      <button 
        onClick={onTaskComplete}
        className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-medium rounded-lg transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)]"
      >
        标记为已读
      </button>
    </div>
  </div>
);

// 3. 项目视图 (Project)
const ProjectView = ({ task, onTaskComplete }: TaskContentRendererProps) => (
  <div className="space-y-6">
    <h4 className="text-xl font-serif font-bold text-white mb-4">{task.title}</h4>
    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
      <h5 className="text-indigo-400 font-bold mb-2">🎯 项目目标</h5>
      <p className="text-slate-300 text-sm">
        {task.content?.projectBrief || '独立设计并实现一个小型综合项目，检验学习成果。'}
      </p>
    </div>
    {task.content?.requirements && (
      <div>
        <h5 className="text-white font-bold mb-3">📋 核心要求</h5>
        <ul className="space-y-2">
          {task.content.requirements.map((req: string, idx: number) => (
            <li key={idx} className="flex items-center text-slate-300 text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-3"></span>
              {req}
            </li>
          ))}
        </ul>
      </div>
    )}
    <div className="flex justify-end pt-4 border-t border-white/10">
      <button 
        onClick={onTaskComplete}
        className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-medium rounded-lg transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)]"
      >
        提交项目报告
      </button>
    </div>
  </div>
);

// 主渲染器组件
export default function TaskContentRenderer({ task, onTaskComplete }: TaskContentRendererProps) {
  switch (task.type) {
    case 'quiz':
      return <QuizView task={task} onTaskComplete={onTaskComplete} />;
    case 'note':
      return <NoteView task={task} onTaskComplete={onTaskComplete} />;
    case 'project':
      return <ProjectView task={task} onTaskComplete={onTaskComplete} />;
    default:
      return <div className="text-slate-500">未知任务类型</div>;
  }
}
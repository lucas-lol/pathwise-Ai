// src/components/TaskContentRenderer.tsx
import { useState } from 'react';

interface TaskContentRendererProps {
  task: any;
  onTaskComplete: () => void;
}

// 1. 答题视图 (Quiz)
const QuizView = ({ task, onTaskComplete }: TaskContentRendererProps) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const questionData = task.content?.questions?.[0] || {
    question: `【${task.title}】请完成本题测试。`,
    options: [{ id: 'A', text: '选项 A' }, { id: 'B', text: '选项 B' }, { id: 'C', text: '选项 C' }, { id: 'D', text: '选项 D' }],
    correctAnswer: 'A'
  };

  const handleSubmit = () => {
    if (!selectedOption) return;
    setIsSubmitted(true);
    if (selectedOption === questionData.correctAnswer) {
      setIsCorrect(true);
      setTimeout(() => onTaskComplete(), 1000);
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
          let optStyle = "bg-white/5 border-white/10 hover:bg-white/10";
          if (selectedOption === opt.id) {
            optStyle = isSubmitted ? (isCorrect ? "bg-emerald-600/20 border-emerald-500" : "bg-red-600/20 border-red-500") : "bg-indigo-600/20 border-indigo-500";
          } else if (isSubmitted && opt.id === questionData.correctAnswer) {
            optStyle = "bg-emerald-600/20 border-emerald-500 opacity-80";
          }
          return (
            <button key={opt.id} onClick={() => !isSubmitted && setSelectedOption(opt.id)} disabled={isSubmitted} className={`p-4 rounded-xl border text-left transition-all duration-300 ${optStyle} ${!isSubmitted ? 'cursor-pointer' : 'cursor-default'}`}>
              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full border mr-3 text-sm font-bold ${selectedOption === opt.id ? (isSubmitted ? (isCorrect ? "bg-emerald-500 border-emerald-400 text-white" : "bg-red-500 border-red-400 text-white") : "bg-indigo-500 border-indigo-400 text-white") : "border-slate-600 text-slate-400"}`}>{opt.id}</span>
              <span className="text-slate-200">{opt.text}</span>
            </button>
          );
        })}
      </div>
      {isSubmitted && (
        <div className={`p-4 rounded-xl border ${isCorrect ? "bg-emerald-500/10 border-emerald-500/30" : "bg-red-500/10 border-red-500/30"} animate-[slideUpFade_0.3s_ease-out]`}>
          {isCorrect ? (
            <div className="flex items-center gap-2 text-emerald-400 font-medium"><span className="text-xl">✅</span> 回答正确！即将解锁下一任务...</div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-red-400 font-medium"><span className="text-xl">❌</span> 回答错误，正确答案是 {questionData.correctAnswer}。</div>
              <button onClick={handleRetry} className="mt-2 px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors">重新作答</button>
            </div>
          )}
        </div>
      )}
      {!isSubmitted && (
        <div className="flex justify-end pt-4 border-t border-white/10">
          <button onClick={handleSubmit} disabled={!selectedOption} className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white font-medium rounded-lg transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] disabled:shadow-none">提交答案</button>
        </div>
      )}
    </div>
  );
};

// 2. 视频视图 (Video)
const VideoView = ({ task, onTaskComplete }: TaskContentRendererProps) => (
  <div className="space-y-6">
    <h4 className="text-xl font-serif font-bold text-white mb-4">{task.title}</h4>
    <div className="aspect-video bg-black/40 rounded-xl border border-white/10 flex items-center justify-center relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
      <button className="relative z-10 w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform border border-white/30"><span className="text-3xl text-white ml-1">▶</span></button>
      <p className="absolute bottom-4 left-4 text-slate-300 text-sm z-10">{task.content?.videoUrl ? '点击播放视频' : '视频资源加载中...'}</p>
    </div>
    <p className="text-slate-400 text-sm">{task.description}</p>
    <div className="flex justify-end pt-4 border-t border-white/10">
      <button onClick={onTaskComplete} className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-medium rounded-lg transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)]">标记为已观看</button>
    </div>
  </div>
);

// 3. 文章/笔记视图 (Article/Note)
const ArticleView = ({ task, onTaskComplete }: TaskContentRendererProps) => (
  <div className="prose prose-invert max-w-none space-y-6">
    <h4 className="text-xl font-serif font-bold text-white mb-4">{task.title}</h4>
    <div className="text-slate-300 leading-relaxed space-y-4 bg-white/5 p-6 rounded-xl border border-white/10">
      {task.content?.text ? <div dangerouslySetInnerHTML={{ __html: task.content.text }} /> : <p>{task.description || '暂无详细内容，请先完成前置学习。'}</p>}
    </div>
    <div className="flex justify-end pt-4 border-t border-white/10">
      <button onClick={onTaskComplete} className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-medium rounded-lg transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)]">标记为已读</button>
    </div>
  </div>
);

// 4. 项目视图 (Project)
const ProjectView = ({ task, onTaskComplete }: TaskContentRendererProps) => (
  <div className="space-y-6">
    <h4 className="text-xl font-serif font-bold text-white mb-4">{task.title}</h4>
    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
      <h5 className="text-indigo-400 font-bold mb-2">🎯 项目目标</h5>
      <p className="text-slate-300 text-sm">{task.content?.projectBrief || task.description}</p>
    </div>
    {task.content?.requirements && (
      <div>
        <h5 className="text-white font-bold mb-3">📋 核心要求</h5>
        <ul className="space-y-2">
          {task.content.requirements.map((req: string, idx: number) => (
            <li key={idx} className="flex items-center text-slate-300 text-sm"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-3"></span>{req}</li>
          ))}
        </ul>
      </div>
    )}
    <div className="flex justify-end pt-4 border-t border-white/10">
      <button onClick={onTaskComplete} className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-medium rounded-lg transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)]">提交项目报告</button>
    </div>
  </div>
);

// 主渲染器
export default function TaskContentRenderer({ task, onTaskComplete }: TaskContentRendererProps) {
  const type = task.type?.toLowerCase();
  if (type === 'quiz') return <QuizView task={task} onTaskComplete={onTaskComplete} />;
  if (type === 'video') return <VideoView task={task} onTaskComplete={onTaskComplete} />;
  if (type === 'article' || type === 'note') return <ArticleView task={task} onTaskComplete={onTaskComplete} />;
  if (type === 'project') return <ProjectView task={task} onTaskComplete={onTaskComplete} />;
  return <div className="text-slate-500 p-4">未知任务类型: {task.type}</div>;
}
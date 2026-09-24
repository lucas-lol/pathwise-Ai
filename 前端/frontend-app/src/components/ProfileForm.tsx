import { useState, useEffect } from 'react';

export default function ProfileForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [step, setStep] = useState(1);
  const [grade, setGrade] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [mathScore, setMathScore] = useState(50);

  // 自动跳转逻辑
  const handleAutoNext = (action: () => void) => {
    action();
    setTimeout(() => setStep((prev) => prev + 1), 600); // 0.6秒后自动跳
  };

  const toggleInterest = (item: string) => {
    if (selectedInterests.includes(item)) {
      setSelectedInterests(selectedInterests.filter(i => i !== item));
    } else {
      if (selectedInterests.length < 3) {
        const newSelection = [...selectedInterests, item];
        setSelectedInterests(newSelection);
        // 如果选满 3 个，自动跳转
        if (newSelection.length === 3) {
          setTimeout(() => setStep(3), 800);
        }
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* 背景光晕 */}
      <div className="aurora-bg">
        <div className="aurora-blob blob-1"></div>
        <div className="aurora-blob blob-2"></div>
      </div>

      <div className="glass-card w-full max-w-2xl p-10 min-h-[500px] flex flex-col justify-center relative overflow-hidden">
        
        {/* 顶部进度条 */}
        <div className="absolute top-0 left-0 w-full h-1 bg-slate-800">
          <div 
            className="h-full bg-indigo-500 transition-all duration-700 ease-out shadow-[0_0_10px_#6366f1]"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* 第一步：年级 */}
        {step === 1 && (
          <div className="space-y-8 animate-[slideUpFade_0.6s_ease-out_forwards]">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-serif-cn font-bold text-white">你现在读几年级？</h2>
              <p className="text-slate-400 font-light">这将决定我们为你匹配的知识库深度。</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {['初一', '初二', '初三', '高一', '高二', '高三'].map((g) => (
                <button
                  key={g}
                  onClick={() => handleAutoNext(() => setGrade(g))}
                  className={`p-6 rounded-xl border text-lg font-medium transition-all duration-300 ${
                    grade === g 
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] scale-105' 
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20 hover:scale-105'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 第二步：兴趣 */}
        {step === 2 && (
          <div className="space-y-8 animate-[slideUpFade_0.6s_ease-out_forwards]">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-serif-cn font-bold text-white">你对什么领域感兴趣？</h2>
              <p className="text-slate-400 font-light">
                {selectedInterests.length === 3 ? '已选满，即将进入下一步...' : `已选 ${selectedInterests.length} 个，最多选 3 个。`}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {['科技编程', '艺术设计', '商业金融', '科学探索', '文学历史', '社会科学'].map((item) => {
                const isSelected = selectedInterests.includes(item);
                return (
                  <button
                    key={item}
                    onClick={() => toggleInterest(item)}
                    className={`p-6 rounded-xl border text-lg font-medium transition-all duration-300 ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] scale-105'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>

            {/* 如果没选满 3 个，显示优雅的继续按钮 */}
            {selectedInterests.length > 0 && selectedInterests.length < 3 && (
              <div className="flex justify-center pt-4">
                <button 
                  onClick={() => setStep(3)}
                  className="px-8 py-3 bg-white/10 border border-white/20 text-white rounded-full hover:bg-white/20 transition-all backdrop-blur-md"
                >
                  确认并继续 →
                </button>
              </div>
            )}
          </div>
        )}

        {/* 第三步：分数 */}
        {step === 3 && (
          <div className="space-y-10 animate-[slideUpFade_0.6s_ease-out_forwards] px-4">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-serif-cn font-bold text-white">目前的数学水平？</h2>
              <p className="text-slate-400 font-light">拖动滑块，诚实评估自己。</p>
            </div>

            <div className="space-y-6 py-8">
              <div className="text-center">
                <span className="text-6xl font-display font-bold text-white tabular-nums">{mathScore}</span>
                <span className="text-xl text-slate-400 ml-2">/ 100</span>
              </div>
              
              {/* 自定义滑块 */}
              <input
                type="range"
                min="0" max="100"
                value={mathScore}
                onChange={(e) => setMathScore(Number(e.target.value))}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
              
              <div className="flex justify-between text-xs text-slate-500 font-medium uppercase tracking-wider">
                <span>需要补基础</span>
                <span>学霸级别</span>
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <button 
                onClick={() => onSubmit({
                  grade, interests: selectedInterests, scores: { math: mathScore }, profile_complete: true
                })}
                className="group relative px-10 py-4 bg-indigo-600 text-white font-medium rounded-full overflow-hidden transition-all hover:scale-105 shadow-[0_0_30px_rgba(99,102,241,0.4)]"
              >
                <span className="relative z-10 text-lg">生成我的学习路径</span>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
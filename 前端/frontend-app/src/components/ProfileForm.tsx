import { useEffect, useState } from 'react';

export default function ProfileForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [step, setStep] = useState(1);
  const [grade, setGrade] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [mathScore, setMathScore] = useState(50);
  const [selectedCareer, setSelectedCareer] = useState('');
  const [careers, setCareers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

useEffect(() => {
  fetch('http://localhost:8000/api/careers')
    .then(res => res.json())
    .then(data => setCareers(data))
    .catch(err => console.error('获取职业失败', err));
}, []);

  // 测试职业数据 (稍后替换为 Excel 数据)
  const CAREERS = [
    { id: 'business_analyst', name: '商业分析师' },
    { id: 'data_scientist', name: '数据科学家' },
    { id: 'software_engineer', name: '软件工程师' },
    { id: 'product_manager', name: '产品经理' },
    { id: 'ux_designer', name: 'UX 设计师' },
    { id: 'financial_advisor', name: '财务顾问' },
  ];

  const handleAutoNext = (action: () => void) => {
    action();
    setTimeout(() => setStep((prev) => prev + 1), 400);
  };

 const toggleInterest = (item: string) => {
  if (selectedInterests.includes(item)) {
    // 取消选择
    setSelectedInterests(selectedInterests.filter(i => i !== item));
  } else {
    if (selectedInterests.length < 3) {
      const newSelection = [...selectedInterests, item];
      setSelectedInterests(newSelection);
      
      // 🎯 如果选满 3 个，0.8 秒后自动跳转
      if (newSelection.length === 3) {
        setTimeout(() => {
          setStep(3); // 跳到第 3 步（数学分数）
        }, 800);
      }
    }
  }
};

  // 最终提交
  const handleFinalSubmit = () => {
    onSubmit({
      grade,
      interests: selectedInterests,
      scores: { math: mathScore },
      selected_career: selectedCareer, //  把职业传给后端
      profile_complete: true //  只标记画像完成
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="aurora-background" />
      <div className="glass-card w-full max-w-2xl p-10 min-h-[500px] flex flex-col justify-center relative">
        
        {/* 顶部进度条 */}
        <div className="absolute top-0 left-0 w-full h-1 bg-slate-800">
          <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${(step / 4) * 100}%` }} />
        </div>

        {/* Step 1: 年级 */}
        {step === 1 && (
          <div className="space-y-8 animate-[slideUpFade_0.5s_ease-out_forwards]">
            <h2 className="text-3xl font-serif-cn font-bold text-white text-center">你现在读几年级？</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {['初一', '初二', '初三', '高一', '高二', '高三'].map((g) => (
                <button key={g} onClick={() => handleAutoNext(() => setGrade(g))}
                  className={`p-6 rounded-xl border text-lg font-medium transition-all ${grade === g ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}`}>
                  {g}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: 兴趣 */}
        {step === 2 && (
          <div className="space-y-8 animate-[slideUpFade_0.5s_ease-out_forwards]">
            <h2 className="text-3xl font-serif-cn font-bold text-white text-center">你对什么感兴趣？(选 1-3 个)</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {['科技编程', '艺术设计', '商业金融', '科学探索', '文学历史', '社会科学'].map((item) => (
                <button key={item} onClick={() => toggleInterest(item)}
                  className={`p-6 rounded-xl border text-lg font-medium transition-all ${selectedInterests.includes(item) ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-white/5 border-white/10 text-slate-300'}`}>
                  {item}
                </button>
              ))}
            </div>
            <div className="flex justify-center">
              <button onClick={() => setStep(3)} disabled={selectedInterests.length === 0}
                className="px-8 py-3 bg-indigo-600 text-white rounded-lg disabled:opacity-50">下一步</button>
            </div>
          </div>
        )}

        {/* Step 3: 分数 */}
        {step === 3 && (
          <div className="space-y-8 animate-[slideUpFade_0.5s_ease-out_forwards] px-4">
            <h2 className="text-3xl font-serif-cn font-bold text-white text-center">目前的数学水平？</h2>
            <div className="text-center text-6xl font-bold text-indigo-400">{mathScore}</div>
            <input type="range" min="0" max="100" value={mathScore} onChange={(e) => setMathScore(Number(e.target.value))} className="w-full accent-indigo-500" />
            <div className="flex justify-center">
              <button onClick={() => setStep(4)} className="px-8 py-3 bg-indigo-600 text-white rounded-lg">下一步</button>
            </div>
          </div>
        )}

        {/* Step 4: 职业选择 (动态加载 + 搜索) */}
{step === 4 && (
  <div className="space-y-6 animate-[slideUpFade_0.5s_ease-out_forwards]">
    <h2 className="text-3xl font-serif-cn font-bold text-white text-center">你想成为什么样的人？</h2>
    
    {/* 搜索框 */}
    <input 
      type="text" 
      placeholder="搜索职业名称或领域..." 
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
    />

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
      {careers
        .filter(c => 
          c.name_cn.includes(searchTerm) || 
          c.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.category.includes(searchTerm)
        )
        .map((career) => (
          <button 
            key={career.id} 
            onClick={() => setSelectedCareer(career.id)}
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedCareer === career.id 
                ? 'bg-indigo-600/20 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex justify-between items-start mb-1">
              <span className="text-lg font-medium text-white">{career.name_cn}</span>
              <span className="text-xs text-indigo-400 bg-indigo-900/30 px-2 py-1 rounded">{career.category}</span>
            </div>
            <div className="text-sm text-slate-400">{career.name_en}</div>
          </button>
        ))}
    </div>

    <div className="flex justify-center pt-4">
      <button 
        onClick={handleFinalSubmit} 
        disabled={!selectedCareer}
        className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)]"
      >
        生成我的学习路径
      </button>
    </div>
  </div>
)}

      </div>
    </div>
  );
}
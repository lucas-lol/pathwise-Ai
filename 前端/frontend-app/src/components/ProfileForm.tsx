import { useState, useEffect } from 'react';

export default function ProfileForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [step, setStep] = useState(1);
  
  // 表单状态
  const [grade, setGrade] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [mathScore, setMathScore] = useState(50); 
  const [selectedCareer, setSelectedCareer] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [careers, setCareers] = useState<any[]>([]);
  const [loadingCareers, setLoadingCareers] = useState(true);

    // 获取职业数据 (带强制超时和兜底机制)
  useEffect(() => {
    console.log("🚀 开始获取职业数据...");
    setLoadingCareers(true);

    // 兜底数据：如果网络请求失败，至少能展示这些，保证演示不崩
    const fallbackCareers = [
      { id: "software_engineer", name_cn: "软件工程师", name_en: "Software Engineer", category: "Technology" },
      { id: "data_scientist", name_cn: "数据科学家", name_en: "Data Scientist", category: "Data" },
      { id: "financial_analyst", name_cn: "金融分析师", name_en: "Financial Analyst", category: "Business" },
      { id: "ai_researcher", name_cn: "AI 研究员", name_en: "AI Researcher", category: "Science" },
    ];

    const fetchCareers = async () => {
      try {
        // 创建一个 3 秒超时的 Promise
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("请求超时")), 3000)
        );

        //  race：谁先完成就用谁的结果
        const response = await Promise.race([
          fetch('http://127.0.0.1:8000/api/careers'), // 使用 127.0.0.1 避免 localhost 解析问题
          timeoutPromise
        ]) as Response;

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        console.log("✅ 成功获取职业数据:", data.length, "个");
        setCareers(data);
      } catch (error) {
        console.warn("⚠️ 网络请求失败或超时，启用兜底数据:", error);
        setCareers(fallbackCareers); // 启用兜底数据
      } finally {
        setLoadingCareers(false); // 无论如何，3秒后必须关闭 loading
      }
    };

    fetchCareers();
  }, []);

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const handleFinalSubmit = () => {
    onSubmit({
      grade,
      interests,
      scores: { mathematics: mathScore }, 
      selected_career: selectedCareer
    });
  };

  const toggleInterest = (tag: string) => {
    if (interests.includes(tag)) {
      setInterests(interests.filter(i => i !== tag));
    } else if (interests.length < 3) {
      const newInterests = [...interests, tag];
      setInterests(newInterests);
      // 如果选满了 3 个，自动跳转到下一步
      if (newInterests.length === 3) {
        setTimeout(() => handleNext(), 400);
      }
    }
  };

  const interestTags = [
    { cn: '科技', en: 'Technology' },
    { cn: '科学', en: 'Science' },
    { cn: '商业', en: 'Business' },
    { cn: '艺术', en: 'Art' },
    { cn: '工程', en: 'Engineering' },
    { cn: '数据', en: 'Data' }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* 极光背景 */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-600/10 rounded-full blur-[100px] animate-[float_25s_infinite_ease-in-out_alternate]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-cyan-600/10 rounded-full blur-[100px] animate-[float_25s_infinite_ease-in-out_alternate_5s]" />
      </div>

      <div className="glass-card w-full max-w-3xl p-8 md:p-12 space-y-8 animate-[slideUpFade_0.6s_ease-out_forwards]">
        
        {/* 顶部进度条 */}
        <div className="flex justify-between mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`flex-1 h-1 mx-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-gradient-to-r from-indigo-500 to-cyan-400 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-slate-800'}`} />
          ))}
        </div>

        {/* Step 1: 年级 (点击自动跳转) */}
        {step === 1 && (
          <div className="space-y-8 animate-[slideUpFade_0.5s_ease-out_forwards]">
            <div className="text-center space-y-2">
              <h2 className="text-4xl font-serif-cn font-bold text-white tracking-tight">你目前是哪个年级？</h2>
              <p className="text-slate-400 text-lg">选择你当前的学习阶段</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {['初一', '初二', '初三', '高一', '高二', '高三'].map(g => (
                <button
                  key={g}
                  onClick={() => {
                    setGrade(g);
                    // 选中后延迟 250ms 自动跳转，让高亮动画播放完，体验更丝滑
                    setTimeout(() => handleNext(), 250);
                  }}
                  className={`p-6 rounded-2xl border-2 transition-all duration-300 group ${
                    grade === g 
                      ? 'bg-indigo-600/20 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)] scale-105' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <span className={`text-xl font-bold ${grade === g ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                    {g}
                  </span>
                </button>
              ))}
            </div>
            
            {/* 保留手动下一步按钮作为备用 */}
            <button 
              onClick={handleNext} 
              disabled={!grade} 
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:from-slate-700 disabled:to-slate-700 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] disabled:shadow-none"
            >
              下一步
            </button>
          </div>
        )}

        {/* Step 2: 兴趣 (选满3个自动跳转) */}
        {step === 2 && (
          <div className="space-y-8 animate-[slideUpFade_0.5s_ease-out_forwards]">
            <div className="text-center space-y-2">
              <h2 className="text-4xl font-serif-cn font-bold text-white tracking-tight">你对什么领域最感兴趣？</h2>
              <p className="text-slate-400 text-lg">最多选择 3 个方向</p>
            </div>
            
            <div className="flex flex-wrap gap-4 justify-center">
              {interestTags.map(tag => (
                <button
                  key={tag.en}
                  onClick={() => toggleInterest(tag.en)}
                  className={`px-8 py-4 rounded-2xl border-2 transition-all duration-300 group ${
                    interests.includes(tag.en)
                      ? 'bg-indigo-600/20 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)] scale-105' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <span className={`text-lg font-bold block ${interests.includes(tag.en) ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                    {tag.cn}
                  </span>
                  <span className={`text-xs block mt-1 ${interests.includes(tag.en) ? 'text-indigo-400' : 'text-slate-500'}`}>
                    {tag.en}
                  </span>
                </button>
              ))}
            </div>
            
            <div className="flex gap-4 pt-4">
              <button onClick={handleBack} className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all">
                上一步
              </button>
              <button 
                onClick={handleNext} 
                disabled={interests.length === 0} 
                className="flex-1 py-4 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:from-slate-700 disabled:to-slate-700 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] disabled:shadow-none"
              >
                下一步
              </button>
            </div>
          </div>
        )}

        {/* Step 3: 数学自我评估（滑动条） */}
        {step === 3 && (
          <div className="space-y-8 animate-[slideUpFade_0.5s_ease-out_forwards]">
            <div className="text-center space-y-2">
              <h2 className="text-4xl font-serif-cn font-bold text-white tracking-tight">你的数学水平如何？</h2>
              <p className="text-slate-400 text-lg">拖动滑块评估你的数学能力</p>
            </div>
            
            <div className="py-12 px-8">
              <div className="mb-8">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={mathScore}
                  onChange={(e) => setMathScore(Number(e.target.value))}
                  className="w-full h-3 bg-slate-800 rounded-full appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
                />
                <div className="flex justify-between mt-4 text-sm text-slate-500">
                  <span>基础薄弱</span>
                  <span>中等水平</span>
                  <span>成绩优异</span>
                </div>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-indigo-600/20 to-cyan-600/20 border-2 border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                  <span className="text-5xl font-bold text-white">{mathScore}</span>
                </div>
                <p className="text-slate-400 mt-4 text-lg">
                  {mathScore < 30 ? '基础薄弱，需要补强' : mathScore < 70 ? '中等水平，稳步提升' : '成绩优异，挑战高阶'}
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <button onClick={handleBack} className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all">
                上一步
              </button>
              <button 
                onClick={handleNext} 
                className="flex-1 py-4 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)]"
              >
                下一步
              </button>
            </div>
          </div>
        )}

        {/* Step 4: 职业选择 */}
        {step === 4 && (
          <div className="space-y-8 animate-[slideUpFade_0.5s_ease-out_forwards]">
            <div className="text-center space-y-2">
              <h2 className="text-4xl font-serif-cn font-bold text-white tracking-tight">你想成为什么样的人？</h2>
              <p className="text-slate-400 text-lg">从 100 个职业中选择你的目标</p>
            </div>
            
            <input 
              type="text" 
              placeholder="搜索职业名称或领域..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-lg"
            />

            {loadingCareers ? (
              <div className="text-center py-16 text-slate-400">
                <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-lg">正在连接职业数据库...</p>
              </div>
            ) : careers.length === 0 ? (
              <div className="text-center py-16 text-red-400">
                <p className="text-lg">⚠️ 无法获取职业数据，请检查后端</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
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
                      className={`p-5 rounded-xl border-2 text-left transition-all duration-300 group ${
                        selectedCareer === career.id 
                          ? 'bg-indigo-600/20 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)] scale-[1.02]' 
                          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-lg font-bold ${selectedCareer === career.id ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                          {career.name_cn}
                        </span>
                        <span className="text-xs text-indigo-400 bg-indigo-900/30 px-3 py-1 rounded-full">
                          {career.category}
                        </span>
                      </div>
                      <div className="text-sm text-slate-400">{career.name_en}</div>
                    </button>
                  ))}
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button onClick={handleBack} className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all">
                上一步
              </button>
              <button 
                onClick={handleFinalSubmit} 
                disabled={!selectedCareer}
                className="flex-1 py-4 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:from-slate-700 disabled:to-slate-700 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] disabled:shadow-none"
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
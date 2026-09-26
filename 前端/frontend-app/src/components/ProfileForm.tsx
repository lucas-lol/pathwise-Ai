import { useState, useEffect } from 'react';
import MagneticButton from './MagneticButton';
import { API_BASE_URL } from '../config';

export default function ProfileForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [step, setStep] = useState(1);
  
  // 表单状态
  const [grade, setGrade] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [mathScore, setMathScore] = useState(50); 
  const [selectedCareer, setSelectedCareer] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // 职业数据状态
  const [careers, setCareers] = useState<any[]>([]);
  const [loadingCareers, setLoadingCareers] = useState(true);
  const [error, setError] = useState(''); // 👈 新增：用于显示连接错误

  // 👇 提取出来的加载函数，支持局部重试，不会丢失已填的表单数据
  const loadCareers = async () => {
    console.log("🚀 开始获取职业数据...");
    setLoadingCareers(true);
    setError(''); // 清空之前的错误

    try {
      // 👇 关键修改 1：将超时时间延长到 60 秒，给 Render 足够的冷启动时间
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("服务器启动较慢，请重试")), 60000)
      );

      const response = await Promise.race([
        fetch(`${API_BASE_URL}/api/careers`),
        timeoutPromise
      ]) as Response;

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      console.log("✅ 成功获取职业数据:", data.length, "个");
      setCareers(data);
    } catch (err: any) {
      console.warn("⚠️ 获取职业数据失败:", err);
      // 👇 关键修改 2：绝对不使用假数据兜底，而是诚实告诉用户
      setError('服务器正在云端启动中，请等待 30 秒后点击下方按钮重试');
    } finally {
      setLoadingCareers(false);
    }
  };

  // 组件挂载时自动加载一次
  useEffect(() => {
    loadCareers();
  }, []);

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const handleFinalSubmit = () => {
    console.log("🔍 准备提交，当前的 grade 是:", grade);
    localStorage.setItem('pw_grade', grade); // 👈 改回 grade 变量
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
              <p className="text-slate-400 text-lg">从云端数据库获取真实职业目标</p>
            </div>
            
            <input 
              type="text" 
              placeholder="搜索职业名称或领域..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-lg"
            />

            {/* 👇 关键修改 3：优雅处理 Loading 和 Error 状态 */}
            {loadingCareers ? (
              <div className="text-center py-16 text-slate-300">
                <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-lg animate-pulse">正在连接云端职业数据库，请稍候...</p>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <p className="text-amber-400 text-lg mb-6">{error}</p>
                <button 
                  onClick={loadCareers} // 👈 局部重试，不会白屏，也不会丢失已填数据！
                  className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                >
                  🔄 重新连接服务器
                </button>
              </div>
            ) : careers.length === 0 ? (
              <div className="text-center py-16 text-red-400">
                <p className="text-lg">⚠️ 数据库为空，请联系管理员</p>
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
              <div className="flex-1">
                <MagneticButton 
                  onClick={handleFinalSubmit} 
                  disabled={!selectedCareer}
                  className={`w-full py-4 text-lg ${!selectedCareer ? 'bg-slate-800 text-slate-500' : 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white'}`}
                  strength={0.2}
                >
                  生成我的学习路径 ✨
                </MagneticButton>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
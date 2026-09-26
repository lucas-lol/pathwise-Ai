import { API_BASE_URL } from './config';
import { useState } from 'react'; 
import { useNavigate } from 'react-router-dom';

// 模拟 100 个职业数据 (稍后我们会替换成从后端读取 Excel)
const MOCK_CAREERS = [
  { id: 'business_analyst', name: '商业分析师', category: '商业' },
  { id: 'data_scientist', name: '数据科学家', category: '科技' },
  { id: 'software_engineer', name: '软件工程师', category: '科技' },
  { id: 'product_manager', name: '产品经理', category: '商业' },
  { id: 'ux_designer', name: 'UX 设计师', category: '设计' },
  { id: 'financial_advisor', name: '财务顾问', category: '金融' },
  { id: 'marketing_specialist', name: '市场专员', category: '商业' },
  { id: 'teacher', name: '教师', category: '教育' },
  // ... 这里先放几个测试，稍后接入 Excel
];

export default function CareerSelection() {
  const [selectedCareer, setSelectedCareer] = useState('');
  const navigate = useNavigate();
  const studentId = localStorage.getItem('pw_student_id');


    const handleSubmit = async () => {
    // 👇 修复 1：明确告诉用户为什么不能提交，不再静默退出
    if (!studentId) {
      alert('⚠️ 未找到学号，请返回首页重新填写画像。');
      return;
    }
    if (!selectedCareer) {
      alert('⚠️ 请先在列表中点击选择一个目标职业，然后再点击生成。');
      return;
    }

    try {
      // 发送给后端保存职业选择
      const res = await fetch(`${API_BASE_URL}/api/students/${studentId}/state`, {
        method: 'PUT', // 或 POST，取决于你的后端接口
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selected_career: selectedCareer })
      });

      if (res.ok) {
        navigate('/assessment'); // 选完职业，去评估页
      } else {
        // 👇 修复 2：提供更具体的错误信息，帮助用户判断
        alert(`⚠️ 保存职业失败 (状态码: ${res.status})。\n可能是服务器正在启动，请稍等 30 秒后重试。`);
      }
    } catch (e) {
      // 👇 修复 3：明确告知是网络或后端问题
      console.error('提交职业时网络异常:', e);
      alert('⚠️ 网络异常或服务器未响应。\n请检查网络，或等待 1 分钟后刷新页面重试。');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 relative">
      <div className="aurora-background" />
      
      <div className="w-full max-w-4xl mb-8 text-center z-10">
        <h1 className="font-serif-cn text-4xl font-bold text-white mb-4">选择你的职业目标</h1>
        <p className="text-slate-400 text-lg">AI 将根据你的选择，为你定制专属学习路径。</p>
      </div>

      <div className="glass-card w-full max-w-4xl p-8 z-10">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {MOCK_CAREERS.map((career) => (
            <button
              key={career.id}
              onClick={() => setSelectedCareer(career.id)}
              className={`p-6 rounded-xl border text-left transition-all duration-300 ${
                selectedCareer === career.id
                  ? 'bg-indigo-600/20 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)]'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="text-xs text-indigo-400 uppercase tracking-wider mb-2">{career.category}</div>
              <div className={`text-lg font-medium ${selectedCareer === career.id ? 'text-white' : 'text-slate-300'}`}>
                {career.name}
              </div>
            </button>
          ))}
        </div>

        <div className="flex justify-end mt-8">
          <button
            onClick={handleSubmit}
            disabled={!selectedCareer}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white font-medium rounded-lg transition-all"
          >
            确认并进入评估 →
          </button>
        </div>
      </div>
    </div>
  );
}
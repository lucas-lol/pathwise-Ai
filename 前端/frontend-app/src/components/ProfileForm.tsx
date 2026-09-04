import React, { useState } from 'react';

const PRESET_INTERESTS = [
  { id: 'technology', label: '💻 科技与编程', desc: '喜欢写代码、玩科技产品' },
  { id: 'science', label: '🔬 生命与科学', desc: '探索自然、物理化学实验' },
  { id: 'art', label: '🎨 艺术与设计', desc: '绘画、UI设计、审美创作' },
  { id: 'business', label: '📊 商业与经济', desc: '商业思维、领导力与财商' },
  { id: 'literature', label: '📚 文学与人文', desc: '阅读、写作与历史哲学' },
];

export default function ProfileForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [grade, setGrade] = useState<number>(10);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [mathScore, setMathScore] = useState<number>(80);

  const toggleInterest = (id: string) => {
    if (selectedInterests.includes(id)) {
      setSelectedInterests(selectedInterests.filter(i => i !== id));
    } else {
      if (selectedInterests.length < 3) {
        setSelectedInterests([...selectedInterests, id]);
      } else {
        alert('最多只能选择 3 个兴趣方向哦！');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      grade: String(grade),
      interests: selectedInterests,
      scores: { math: mathScore },
      self_assessment: [mathScore >= 80 ? 'advanced' : 'intermediate'],
      goals: [],
      no_grade: false,
      profile_complete: true
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto p-8 bg-white rounded-2xl shadow-xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">PathWise AI - 定制你的学习画像</h2>
        <p className="text-sm text-gray-500 mt-1">拖动滑块与点选标签，轻松完成画像配置</p>
      </div>

      {/* 1. 年级选择 */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">你目前在读几年级？</label>
        <div className="flex gap-2">
          {[7, 8, 9, 10, 11, 12].map((g) => (
            <button
              type="button"
              key={g}
              onClick={() => setGrade(g)}
              className={`px-4 py-2 rounded-lg border font-medium transition ${
                grade === g ? 'bg-indigo-600 text-white border-indigo-600 shadow' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              高{g - 6} / 初{g}
            </button>
          ))}
        </div>
      </div>

      {/* 2. 兴趣标签点选 */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          你对什么最感兴趣？ <span className="text-gray-400 font-normal">（最多选 3 个）</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          {PRESET_INTERESTS.map((item) => {
            const isSelected = selectedInterests.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => toggleInterest(item.id)}
                className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                  isSelected ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div>
                  <div className="font-semibold text-gray-800">{item.label}</div>
                  <div className="text-xs text-gray-500">{item.desc}</div>
                </div>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                  isSelected ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300'
                }`}>
                  {isSelected && '✓'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. 学科成绩滑块 */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-sm font-semibold text-gray-700">数学/逻辑基础自测</label>
          <span className="text-indigo-600 font-bold">{mathScore} 分</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={mathScore}
          onChange={(e) => setMathScore(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0 (零基础)</span>
          <span>50 (中游)</span>
          <span>100 (学霸)</span>
        </div>
      </div>

      {/* 4. 提交按钮 */}
      <button
        type="submit"
        className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition"
      >
        保存画像并开启智能闯关 🚀
      </button>
    </form>
  );
}

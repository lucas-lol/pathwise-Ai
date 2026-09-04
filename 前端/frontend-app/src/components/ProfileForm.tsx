import React, { useState } from 'react';

const PRESET_INTERESTS = [
  { id: 'technology', label: '科技与编程', desc: '喜欢写代码、玩科技产品' },
  { id: 'science', label: '生命与科学', desc: '探索自然、物理化学实验' },
  { id: 'art', label: '艺术与设计', desc: '绘画、UI设计、审美创作' },
  { id: 'business', label: '商业与经济', desc: '商业思维、领导力与财商' },
  { id: 'literature', label: '文学与人文', desc: '阅读、写作与历史哲学' },
];

export default function ProfileForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [grade, setGrade] = useState<number>(10);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [mathScore, setMathScore] = useState<number>(80);
  const [status, setStatus] = useState<{type: 'success' | 'error', msg: string} | null>(null);

  const toggleInterest = (id: string) => {
    if (selectedInterests.includes(id)) {
      setSelectedInterests(selectedInterests.filter(i => i !== id));
    } else {
      if (selectedInterests.length < 3) {
        setSelectedInterests([...selectedInterests, id]);
      } else {
        setStatus({ type: 'error', msg: '最多只能选择 3 个兴趣方向哦！' });
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      onSubmit({
        grade: String(grade),
        interests: selectedInterests,
        scores: { math: mathScore },
        self_assessment: [mathScore >= 80 ? 'advanced' : 'intermediate'],
        goals: [],
        no_grade: false,
        profile_complete: true
      });
      setStatus({ type: 'success', msg: '保存成功！' });
    } catch (e) {
      setStatus({ type: 'error', msg: '保存失败，请重试。' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card bg-base-100 shadow-xl max-w-xl mx-auto p-8 space-y-4">
      <div>
        <h2 className="text-2xl font-bold">PathWise AI - 定制你的学习画像</h2>
        <p className="text-sm opacity-70">拖动滑块与点选标签，轻松完成画像配置</p>
      </div>

      {status && (
        <div className={`alert ${status.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {status.msg}
        </div>
      )}

      {/* 1. 年级选择 */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold">你目前在读几年级？</label>
        <div className="flex flex-wrap gap-2">
          {[7, 8, 9, 10, 11, 12].map((g) => (
            <button
              type="button"
              key={g}
              onClick={() => setGrade(g)}
              className={`btn btn-sm ${grade === g ? 'btn-primary' : ''}`}
            >
              高{g - 6} / 初{g}
            </button>
          ))}
        </div>
      </div>

      {/* 2. 兴趣标签点选 */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold">
          你对什么最感兴趣？ <span className="opacity-60 font-normal">（最多选 3 个）</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PRESET_INTERESTS.map((item) => {
            const isSelected = selectedInterests.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => toggleInterest(item.id)}
                className={`card card-compact border p-3 cursor-pointer ${
                  isSelected ? 'border-primary' : 'border-base-300'
                }`}
              >
                <div className="font-semibold">{item.label}</div>
                <div className="text-xs opacity-70">{item.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. 学科成绩滑块 */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-semibold">数学/逻辑基础自测</label>
          <span className="text-primary font-bold">{mathScore} 分</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={mathScore}
          onChange={(e) => setMathScore(Number(e.target.value))}
          className="range range-primary"
        />
      </div>

      {/* 4. 提交按钮 */}
      <button type="submit" className="btn btn-primary w-full">
        保存画像
      </button>
    </form>
  );
}

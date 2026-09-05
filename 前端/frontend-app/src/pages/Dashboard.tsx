import { useEffect, useState } from 'react';

type Funnel = {
  profile_complete: boolean;
  assessment_complete: boolean;
  career_selected: boolean;
  route_ready: boolean;
};

type StateData = {
  profile?: { grade?: string; interests?: string[]; goals?: string[] };
  funnel?: Funnel;
  selected_career?: string;
};

const FUNNEL_LABELS: { key: keyof Funnel; label: string }[] = [
  { key: 'profile_complete', label: '画像' },
  { key: 'assessment_complete', label: '评估' },
  { key: 'career_selected', label: '职业' },
  { key: 'route_ready', label: '路线' },
];

export default function Dashboard() {
  const [state, setState] = useState<StateData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const id = localStorage.getItem('pw_student_id');
    if (!id) { setError('未找到学号，请先完成画像。'); return; }
    fetch(`http://localhost:8000/api/students/${id}/state`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
      .then(setState)
      .catch(e => setError('加载状态失败：' + e.message));
  }, []);

  if (error) return <div className="alert alert-error m-4">{error}</div>;
  if (!state) return <div className="m-4">加载中…</div>;

  const funnel = state.funnel;
  const profile = state.profile || {};
  const badges = [profile.grade, ...(profile.interests || []), ...(profile.goals || [])].filter(Boolean) as string[];

  return (
    <div className="p-6 space-y-6">
      <div className="stats stats-horizontal shadow w-full">
        {FUNNEL_LABELS.map(({ key, label }) => (
          <div className="stat" key={key}>
            <div className="stat-title">{label}</div>
            <div className={`stat-value text-2xl ${funnel?.[key] ? 'text-success' : 'text-gray-500'}`}>
              {funnel?.[key] ? '已亮' : '未亮'}
            </div>
          </div>
        ))}
      </div>

      {state.selected_career && (
        <div className="alert alert-info">已选职业：{state.selected_career}</div>
      )}

      <div className="flex gap-2 flex-wrap">
        {badges.length
          ? badges.map(b => <span key={b} className="badge badge-lg badge-outline">{b}</span>)
          : <span className="text-gray-500">暂无画像信息</span>}
      </div>
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import NavBar from '../components/NavBar';

interface StudentState {
  funnel_stage: number;
  grade: string;
  interest: string;
  goal: string;
}

const Dashboard = () => {
  const [state, setState] = useState<StudentState | null>(null);
  const [loading, setLoading] = useState(true);
  const id = localStorage.getItem('pw_student_id');

  useEffect(() => {
    if (id) {
      fetch(`http://localhost:8000/api/students/${id}/state`)
        .then((res) => res.json())
        .then((data) => {
          setState(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [id]);

  if (!id) return <div className="p-4 alert alert-warning">请先完成个人画像</div>;
  if (loading) return <div className="p-4">加载中...</div>;

  return (
    <div className="p-4 space-y-4">
      <NavBar />
      <div className="stats shadow bg-base-100 w-full rounded-2xl">
        {[1, 2, 3, 4].map((i) => (
          <div className="stat" key={i}>
            <div className="stat-title">阶段 {i}</div>
            <div className={`stat-value ${state && state.funnel_stage >= i ? 'text-success' : 'text-gray-300'}`}>●</div>
          </div>
        ))}
      </div>
      {state && (
        <div className="flex gap-4">
          <div className="badge badge-primary badge-lg">{state.grade}</div>
          <div className="badge badge-secondary badge-lg">{state.interest}</div>
          <div className="badge badge-accent badge-lg">{state.goal}</div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

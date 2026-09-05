import { useEffect, useState } from 'react';

type Question = {
  id: string;
  knowledge_point_id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
};

type AssessmentResult = {
  correct: number;
  total: number;
  score: number;
  mastery: Record<string, number>;
};

export default function Assessment() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // 后端合同：GET /api/assessments/{subject_id}/questions
    fetch('http://localhost:8000/api/assessments/mathematics/questions')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setQuestions(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSelect = (questionId: string, option: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = async () => {
    const studentId = localStorage.getItem('pw_student_id');
    if (!studentId) return;
    
    const unanswered = questions.length - Object.keys(answers).length;
    if (unanswered > 0) {
      alert(`还有 ${unanswered} 题未答`);
      return;
    }

    setSubmitting(true);
    try {
      // 后端合同：POST /api/students/{user_id}/assessment
      const res = await fetch(`http://localhost:8000/api/students/${studentId}/assessment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject_id: 'mathematics',
          answers: Object.entries(answers).map(([question_id, answer]) => ({
            question_id,
            answer
          }))
        })
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
      } else {
        alert('提交失败');
      }
    } catch (e) {
      alert('网络异常');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-4 text-center text-gray-500">加载题目中...</div>;
  if (questions.length === 0) return <div className="alert alert-warning m-4">暂无数学题目</div>;

  const options = [
    { key: 'A', val: 'option_a' as const },
    { key: 'B', val: 'option_b' as const },
    { key: 'C', val: 'option_c' as const },
    { key: 'D', val: 'option_d' as const },
  ];

  if (result) {
    return (
      <div className="p-4 space-y-4">
        <div className="alert alert-success shadow-lg">
          <span>🎉 评估完成！得分：<strong className="text-2xl mx-2">{result.score}</strong> ({result.correct}/{result.total})</span>
        </div>
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">知识点掌握度</h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(result.mastery).map(([kp, score]) => (
                <div key={kp} className="badge badge-lg badge-primary badge-outline gap-1 p-3">
                  {kp} <span className="font-bold">{(score * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">返回仪表盘可查看最后一盏灯“评估”点亮。</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold">数学评估闯关</h2>
      {questions.map((q, idx) => (
        <div key={q.id} className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h3 className="card-title text-base">
              <span className="badge badge-accent">{idx + 1}</span> 
              {q.question}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              {options.map(opt => (
                <label key={opt.key} className={`cursor-pointer label border rounded-xl p-3 hover:bg-base-200 transition ${answers[q.id] === opt.key ? 'border-primary bg-primary/10 shadow' : 'border-base-300'}`}>
                  <span className="label-text flex items-center">
                    <input 
                      type="radio" 
                      name={q.id} 
                      className="radio radio-primary mr-2" 
                      checked={answers[q.id] === opt.key}
                      onChange={() => handleSelect(q.id, opt.key)}
                    />
                    <strong className="mr-1">{opt.key}.</strong> {q[opt.val]}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      ))}
      
      <button 
        className="btn btn-primary w-full shadow-lg"
        onClick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? <span className="loading loading-spinner"></span> : '提交试卷'}
      </button>
    </div>
  );
}
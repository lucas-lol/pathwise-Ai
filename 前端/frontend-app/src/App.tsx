import React, { useState } from 'react';
import ProfileForm from './components/ProfileForm';

function App() {
  const [resultMessage, setResultMessage] = useState('');

  const handleProfileSubmit = async (data: any) => {
    let studentId = localStorage.getItem('pw_student_id');

    if (!studentId) {
      try {
        const userRes = await fetch('http://localhost:8000/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: '新同学' }),
        });
        if (!userRes.ok) throw new Error('创建用户失败');
        const user = await userRes.json();
        studentId = user.id;
        localStorage.setItem('pw_student_id', studentId);
      } catch (err) {
        console.error(err);
        alert('网络异常：无法连接到后端，请确保后端已启动');
        return;
      }
    }

    try {
      const response = await fetch(`http://localhost:8000/api/students/${studentId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setResultMessage(`🎉 保存成功（学号：${studentId}）`);
      } else {
        setResultMessage(`❌ 保存失败：${result.detail || JSON.stringify(result)}`);
      }
    } catch (err) {
      console.error(err);
      alert('网络异常：无法连接到后端');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-xl mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-800 text-sm">
        💡 提示：提交前请确保后端已启动 (<code className="bg-white px-2 py-1 rounded">uvicorn main:app --reload</code>)
      </div>

      <ProfileForm onSubmit={handleProfileSubmit} />

      {resultMessage && (
        <pre className="w-full max-w-xl mt-4 p-4 bg-gray-900 text-green-400 rounded-xl text-xs overflow-auto shadow-lg">
          {resultMessage}
        </pre>
      )}
    </div>
  );
}

export default App;

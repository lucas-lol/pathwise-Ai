import React, { useState } from 'react';
import ProfileForm from './components/ProfileForm';

function App() {
  const [resultMessage, setResultMessage] = useState('');

  const handleProfileSubmit = async (data: any) => {
    try {
      const response = await fetch('http://localhost:8000/api/students/1/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      setResultMessage('🎉 成功保存并同步到后端！返回数据: ' + JSON.stringify(result, null, 2));
    } catch (err) {
      console.error(err);
      alert('保存失败！请确保你的 FastAPI 后端已经在 localhost:8000 启动运行。');
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

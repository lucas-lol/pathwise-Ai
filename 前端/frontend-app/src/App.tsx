import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProfileForm from './components/ProfileForm';
import Assessment from './pages/Assessment';
import Dashboard from './pages/Dashboard';

function App() {
  // 处理画像（包含职业）提交的核心逻辑
  const handleProfileSubmit = async (data: any) => {
    let studentId = localStorage.getItem('pw_student_id');
    if (!studentId) {
      studentId = 'stu_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('pw_student_id', studentId);
    }

    try {
      // 发送给后端保存画像和职业选择
      const res = await fetch(`http://localhost:8000/api/students/${studentId}/profile`, {
        method: 'PUT', // 如果后端是 POST，请改为 'POST'
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        // 成功后，直接跳转到 Dashboard
        window.location.href = '/dashboard';
      } else {
        const errorData = await res.json();
        alert(`保存失败: ${errorData.detail || '未知错误'}`);
      }
    } catch (error) {
      console.error('后端连接失败:', error);
      alert('网络异常：无法连接到后端。\n\n请确保：\n1. 后端服务 (uvicorn) 正在运行\n2. 端口为 8000');
    }
  };

  return (
    <Router>
      <Routes>
        {/* 首页：4步画像填写（包含职业选择） */}
        <Route 
          path="/" 
          element={<ProfileForm onSubmit={handleProfileSubmit} />} 
        />
        
        {/* 评估测试 */}
        <Route path="/assessment" element={<Assessment />} />
        
        {/* 仪表盘 */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* 默认重定向到首页 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
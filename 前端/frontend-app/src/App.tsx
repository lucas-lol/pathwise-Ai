import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProfileForm from './components/ProfileForm';
import Dashboard from './pages/Dashboard';
import Assessment from './pages/Assessment';

function App() {
  // 处理画像提交的核心逻辑
  const handleProfileSubmit = async (data: any) => {
    // 1. 获取或生成学生 ID
    let studentId = localStorage.getItem('pw_student_id');
    if (!studentId) {
      studentId = 'stu_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('pw_student_id', studentId);
    }

    try {
      // 2. 尝试发送给后端 (请确保后端有 /api/students/{id}/profile 接口)
      // 如果后端接口是 POST /api/students/，请相应修改 URL 和 method
      const res = await fetch(`http://localhost:8000/api/students/${studentId}/profile`, {
        method: 'PUT', // 或 'POST'，取决于你的后端设计
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        // 3. 成功后，平滑跳转到 Dashboard
        window.location.href = '/dashboard';
      } else {
        const errorData = await res.json();
        alert(`保存失败: ${errorData.detail || '未知错误'}`);
      }
    } catch (error) {
      // 4. 捕获真正的网络异常（比如后端没开）
      console.error('后端连接失败:', error);
      alert('网络异常：无法连接到后端。\n\n请确保：\n1. 后端服务 (uvicorn) 正在运行\n2. 端口为 8000');
    }
  };

  return (
    <Router>
      <Routes>
        {/* 首页：画像填写 */}
        <Route 
          path="/" 
          element={<ProfileForm onSubmit={handleProfileSubmit} />} 
        />
        
        {/* 仪表盘 */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* 评估测试 */}
        <Route path="/assessment" element={<Assessment />} />
        
        {/* 默认重定向 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProfileForm from './components/ProfileForm';
import Assessment from './pages/Assessment';
import Dashboard from './pages/Dashboard';

function App() {
  // 处理画像（包含职业）提交的核心逻辑
   const handleProfileSubmit = async (data: any) => {
    let studentId = localStorage.getItem('pw_student_id');
    
    // 👇 修复：如果没有 ID，生成一个 6 位数的纯数字 ID (例如: 839201)
    // 这样后端 user_id: int 就能成功接收并解析了
    if (!studentId) {
      studentId = String(Math.floor(100000 + Math.random() * 900000));
      localStorage.setItem('pw_student_id', studentId);
    }

    try {
      const res = await fetch(`http://localhost:8000/api/students/${studentId}/profile`, {
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        window.location.href = '/dashboard';
      } else {
        // 👇 修复：更智能地解析后端错误信息，不再显示 [object Object]
        const errorData = await res.json();
        let errorMsg = '未知错误';
        
        // 处理 FastAPI 常见的 422 验证错误格式
        if (errorData.detail && Array.isArray(errorData.detail)) {
          errorMsg = errorData.detail.map((d: any) => d.msg).join(', ');
        } else if (errorData.detail) {
          errorMsg = errorData.detail;
        } else {
          errorMsg = JSON.stringify(errorData);
        }
        
        alert(`保存失败: ${errorMsg}`);
      }
    } catch (error) {
      console.error('后端连接失败:', error);
      alert('网络异常：无法连接到后端。\n请确保后端服务 (uvicorn) 正在运行且端口为 8000');
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
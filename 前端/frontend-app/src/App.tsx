import { API_BASE_URL } from './config';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProfileForm from './components/ProfileForm';
import Assessment from './pages/Assessment';
import Dashboard from './pages/Dashboard';
import RoutePage from './pages/Route';

function App() {
  // 处理画像（包含职业）提交的核心逻辑
  const handleProfileSubmit = async (data: any) => {
    let studentId = localStorage.getItem('pw_student_id');
    alert('App.tsx 收到数据！年级是：' + data.grade);
    // 👇 修复：如果没有 ID，生成一个 6 位数的纯数字 ID (例如: 839201)
    if (!studentId) {
      studentId = String(Math.floor(100000 + Math.random() * 900000));
      localStorage.setItem('pw_student_id', studentId);
    }

    // 👇 新增：统一保存用户选择的年级，供 Assessment 兜底逻辑使用
    if (data.grade) {
      localStorage.setItem('pw_grade', data.grade);
    }

    try {
      // ✅ 注意：最外面必须是反引号 (`)，不能是单引号 (')
      const response = await fetch(`${API_BASE_URL}/api/students/${studentId}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        // 👇 修复：更智能地解析后端错误信息，不再显示 [object Object]
        const errorData = await response.json();
        let errorMsg = '未知错误';
        
        // 处理 FastAPI 常见的 422 验证错误格式
        if (errorData.detail && Array.isArray(errorData.detail)) {
          errorMsg = errorData.detail.map((d: any) => d.msg).join(', ');
        } else if (errorData.detail) {
          errorMsg = errorData.detail;
        } else {
          errorMsg = JSON.stringify(errorData);
        }
        
        throw new Error(errorMsg);
      }

      const result = await response.json();
      console.log('提交成功:', result);
      
      // 提交成功后跳转到 Dashboard
      window.location.href = '/dashboard';
      
    } catch (error: any) {
      console.error('提交画像时出错:', error);
      alert(`保存失败: ${error.message || '请检查网络或稍后再试'}`);
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

        {/* 学习路线 */}
        <Route path="/route" element={<RoutePage />} /> 
        
        {/* 默认重定向到首页 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
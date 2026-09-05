import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import Assessment from './pages/Assessment'
import ProfileForm from './components/ProfileForm' 
import NavBar from './components/NavBar'

function App() {
  const [studentId, setStudentId] = useState(localStorage.getItem('pw_student_id'))
  const [currentView, setCurrentView] = useState('dashboard')

  const handleProfileSave = (id: string) => {
    localStorage.setItem('pw_student_id', id)
    setStudentId(id)
  }

  const handleProfileSubmit = async (data: any) => {
    let activeId = localStorage.getItem('pw_student_id');

    if (!activeId) {
      try {
        const userRes = await fetch('http://localhost:8000/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: '新同学' }),
        });
        if (!userRes.ok) throw new Error('创建用户失败');
        const user = await userRes.json();
        activeId = user.id;
      } catch (err) {
        console.error(err);
        alert('网络异常：无法连接到后端');
        return;
      }
    }

    try {
      const response = await fetch(`http://localhost:8000/api/students/${activeId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        handleProfileSave(activeId!);
      } else {
        const result = await response.json();
        alert(`❌ 保存失败：${result.detail || JSON.stringify(result)}`);
      }
    } catch (err) {
      console.error(err);
      alert('网络异常：无法连接到后端');
    }
  };

  const renderPage = () => {
    switch (currentView) {
      case 'assessment':
        return <Assessment />;
      case 'dashboard':
      default:
        return <Dashboard />;
    }
  };

  return (
    <main className="min-h-screen bg-base-200 p-4">
      {studentId ? (
        <>
          <NavBar onViewChange={setCurrentView} />
          {renderPage()}
        </>
      ) : (
        <ProfileForm onSubmit={handleProfileSubmit} />
      )}
    </main>
  )
}

export default App
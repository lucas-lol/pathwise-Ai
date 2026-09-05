import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import Assessment from './pages/Assessment'
import NavBar from './components/NavBar'
import ProfileForm from './ProfileForm'

function App() {
  const [studentId, setStudentId] = useState(localStorage.getItem('pw_student_id'))
  const [view, setView] = useState('dashboard')

  const handleProfileSave = (id: string) => {
    localStorage.setItem('pw_student_id', id)
    setStudentId(id)
  }

  const renderContent = () => {
    switch (view) {
      case 'dashboard': return <Dashboard />
      case 'assessment': return <Assessment onBack={() => setView('dashboard')} />
      default: return <div className="p-8 alert alert-info">功能“{view}”建设中...</div>
    }
  }

  return (
    <main className="min-h-screen bg-base-200 p-4">
      {studentId ? (
        <>
          <NavBar onViewChange={setView} />
          {renderContent()}
        </>
      ) : (
        <ProfileForm onSave={handleProfileSave} />
      )}
    </main>
  )
}

export default App


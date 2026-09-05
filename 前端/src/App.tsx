import { useState } from 'react'
import Dashboard from './pages/Dashboard'

// 假设 ProfileForm 是现有的组件
import ProfileForm from './ProfileForm' 

function App() {
  const [studentId, setStudentId] = useState(localStorage.getItem('pw_student_id'))

  const handleProfileSave = (id: string) => {
    localStorage.setItem('pw_student_id', id)
    setStudentId(id)
  }

  return (
    <main className="min-h-screen bg-base-200 p-4">
      {studentId ? (
        <Dashboard />
      ) : (
        <ProfileForm onSave={handleProfileSave} />
      )}
    </main>
  )
}

export default App


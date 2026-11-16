import { useState } from 'react'
import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './Components/context/AuthContext'
import LogIn from './Components/LogIn'
import SignUp from './Components/SignUp'
import LandingPage from './Components/LandingPage'
import ProtectedRoute from './Components/context/ProtectedRoute'
import DashboardLayout from './Components/DashboardLayout'
import Dashboard from './Components/Dashboard'
import Projects from './Components/Projects'
import Tasks from './Components/Tasks'
import Notifications from './Components/Notifications'

function App() {
  const [count, setCount] = useState(0)

  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LogIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/" element={<LandingPage />} />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="projects" element={<Projects />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="notifications" element={<Notifications />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
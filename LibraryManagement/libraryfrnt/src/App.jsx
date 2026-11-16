import './App.css'
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'

import Layout from './components/Layout'
import Dashboard from './components/Dashboard' // Import your Dashboard component
import Books from './components/Books'
import SignUp from './components/SignUp'
import LogIn from './components/LogIn'
import { AuthProvider } from './components/context/AuthContext'
import Landingpage from './components/Landingpage'
import Members from './components/Members'
import Reports from './components/Reports'
import Inventory from './components/Inventory'
import Accounts from './components/Accounts'
import Audit from './components/Audit'
import Notifications from './components/Notifications'
import Fines from './components/Fines'
import Circulation from './components/Circulation'
import ProtectedRoute from './components/context/ProtectedRoute'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landingpage />} />
          <Route path="/login" element={<LogIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Protected Routes Wrapper */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/circulation" element={<Circulation />} />
              <Route path="/books" element={<Books />} />
              <Route path="/members" element={<Members />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/audit" element={<Audit />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/fines" element={<Fines />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
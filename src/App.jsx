import { Routes, Route } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import Register from '@/pages/Register'
import ProtectedRoute from '@/components/ProtectedRoute'
import Explore from '@/pages/Explore'
import ProjectDetail from '@/pages/ProjectDetail'
import UploadWizard from '@/pages/UploadWizard'
import Login from '@/pages/Login'
import AdminDashboard from '@/pages/AdminDashboard'
import AuthCallback from '@/pages/AuthCallback'
import MyProjects from '@/pages/MyProjects'
import Profile from '@/pages/Profile'
import Settings from '@/pages/Settings'
import Leaderboard from '@/pages/Leaderboard'

const guard = (el, roles) => <ProtectedRoute requiredRoles={roles}>{el}</ProtectedRoute>

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Explore />} />
        <Route path="/projects/:slug" element={<ProjectDetail />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/upload" element={guard(<UploadWizard />)} />
        <Route path="/edit/:slug" element={guard(<UploadWizard />)} />
        <Route path="/my-projects" element={guard(<MyProjects />)} />
        <Route path="/profile" element={guard(<Profile />)} />
        <Route path="/settings" element={guard(<Settings />)} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/admin" element={guard(<AdminDashboard />, ['instructor', 'admin'])} />
      </Route>
    </Routes>
  )
}

export default App

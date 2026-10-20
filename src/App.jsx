import { Routes, Route } from 'react-router-dom'
import Navbar from '@/components/Navbar'
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


function App() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Navbar />
      <Routes>
        <Route path="/" element={<Explore />} />
        <Route path="/projects/:slug" element={<ProjectDetail />} />
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <UploadWizard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit/:slug"
          element={
            <ProtectedRoute>
              <UploadWizard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-projects"
          element={
            <ProtectedRoute>
              <MyProjects />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRoles={['instructor', 'admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  )
}

export default App

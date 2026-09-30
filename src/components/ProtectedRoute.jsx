import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function ProtectedRoute({ children, requiredRoles }) {
  const { user, isLoading } = useAuth()

  if (isLoading) return <p className="p-8">Loading...</p>
  if (!user) return <Navigate to="/login" replace />
  if (requiredRoles && !requiredRoles.includes(user.role)) {
    return <p className="p-8 text-red-500">You don't have permission to view this page.</p>
  }

  return children
}
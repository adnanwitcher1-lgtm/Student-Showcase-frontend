import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function ProtectedRoute({ children, requiredRoles }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="p-8 space-y-4 max-w-3xl mx-auto">
        <div className="skeleton h-8 w-1/3" />
        <div className="skeleton h-40 w-full" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  if (requiredRoles && !requiredRoles.includes(user.role)) {
    return <p className="p-8 text-destructive">You don't have permission to view this page.</p>
  }

  return children
}

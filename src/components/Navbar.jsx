import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'

export default function Navbar() {
  const { isDark, toggleTheme } = useTheme()
  const { user, isLoading, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="border-b dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="font-bold text-lg dark:text-white">
          Student Showcase
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">

          {/* Admin Link - Only for Instructor/Admin */}
          {user && ['instructor', 'admin'].includes(user.role) && (
            <Link to="/admin">
              <Button size="sm" variant="ghost">
                Admin
              </Button>
            </Link>
          )}

          {/* Upload Project */}
          <Link to="/upload">
            <Button size="sm" className="hidden sm:inline-flex">
              Upload Project
            </Button>

            <Button
              size="icon"
              className="sm:hidden"
              aria-label="Upload project"
            >
              +
            </Button>
          </Link>

          {/* Login / Register / Logout */}
          {!isLoading && !user && (
            <>
              <Link to="/login">
                <Button size="sm" variant="ghost">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" variant="outline">
                  Register
                </Button>
              </Link>
            </>
          )}

          {!isLoading && user && (
            <>
              <span className="hidden sm:inline text-sm text-gray-600 dark:text-gray-300">
                {user.username}
              </span>
              <Button size="sm" variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </>
          )}

          {/* Theme Toggle */}
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {isDark ? '☀️' : '🌙'}
          </Button>

        </div>
      </div>
    </nav>
  )
}
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'

export default function Navbar() {
  const { isDark, toggleTheme } = useTheme()
  const { user, isLoading, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const isStaff = user && ['instructor', 'admin'].includes(user.role)
  const closeMenu = () => setMenuOpen(false)

  const handleLogout = () => {
    closeMenu()
    logout()
    navigate('/login')
  }

  const mobileLink = 'block rounded-md px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800'

  return (
    <nav className="border-b dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="font-bold text-lg dark:text-white">
          Student Showcase
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Desktop links (logged-in) */}
          {user && (
            <div className="hidden sm:flex items-center gap-1">
              <Link to="/my-projects"><Button size="sm" variant="ghost">My Space</Button></Link>
              {isStaff && <Link to="/admin"><Button size="sm" variant="ghost">Admin</Button></Link>}
              <Link to="/profile"><Button size="sm" variant="ghost">{user.username}</Button></Link>
            </div>
          )}

          {/* Upload Project */}
          <Link to="/upload">
            <Button size="sm" className="hidden sm:inline-flex">Upload Project</Button>
            <Button size="icon" className="sm:hidden" aria-label="Upload project">+</Button>
          </Link>

          {/* Guest: Login / Register */}
          {!isLoading && !user && (
            <>
              <Link to="/login"><Button size="sm" variant="ghost">Login</Button></Link>
              <Link to="/register"><Button size="sm" variant="outline">Register</Button></Link>
            </>
          )}

          {!isLoading && user && (
            <Button size="sm" variant="outline" className="hidden sm:inline-flex" onClick={handleLogout}>
              Logout
            </Button>
          )}

          {/* Theme Toggle */}
          <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {isDark ? '☀️' : '🌙'}
          </Button>

          {/* Mobile menu button */}
          {user && (
            <Button
              variant="outline"
              size="icon"
              className="sm:hidden"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Menu"
              aria-expanded={menuOpen}
            >
              ☰
            </Button>
          )}
        </div>
      </div>

      {/* Mobile dropdown */}
      {user && menuOpen && (
        <div className="sm:hidden border-t dark:border-gray-800 px-4 py-2 space-y-1">
          <p className="px-3 py-1 text-xs text-gray-500">Signed in as {user.username}</p>
          <Link to="/my-projects" className={mobileLink} onClick={closeMenu}>My Space</Link>
          <Link to="/profile" className={mobileLink} onClick={closeMenu}>Profile</Link>
          {isStaff && <Link to="/admin" className={mobileLink} onClick={closeMenu}>Admin</Link>}
          <button className={`${mobileLink} w-full text-left`} onClick={handleLogout}>Logout</button>
        </div>
      )}
    </nav>
  )
}

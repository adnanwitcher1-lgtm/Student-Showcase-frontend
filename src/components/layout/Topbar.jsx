import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Menu, Home, Search, Plus, Sun, Moon, User, Settings, FolderKanban, LogOut, ChevronDown } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import Avatar from '@/components/Avatar'
import GithubIcon from '@/components/GithubIcon'
import BackButton from '@/components/BackButton'

function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    const esc = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  const row = 'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-accent transition-colors'

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full p-0.5 pr-2 hover:bg-accent transition-colors"
      >
        <Avatar src={user.avatar} name={user.username} size="sm" />
        <ChevronDown className={`size-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-72 rounded-2xl border bg-popover text-popover-foreground shadow-2xl shadow-primary/20 animate-fade-up overflow-hidden z-50"
        >
          <div className="bg-brand-gradient animated-gradient h-14" />
          <div className="px-4 -mt-7 pb-3">
            <Avatar src={user.avatar} name={user.username} size="lg" className="ring-4 ring-popover" />
            <p className="mt-2 font-semibold leading-tight">{user.username}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email || 'No email added'}</p>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
              <span className="rounded-full bg-primary/15 text-primary px-2 py-0.5 font-medium capitalize">{user.role}</span>
              {user.batch && <span className="rounded-full bg-muted px-2 py-0.5">{user.batch}</span>}
              {user.github_username && (
                <span className="rounded-full bg-muted px-2 py-0.5 inline-flex items-center gap-1">
                  <GithubIcon className="size-3" /> {user.github_username}
                </span>
              )}
            </div>
            {user.bio && <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{user.bio}</p>}
          </div>
          <div className="border-t p-1.5">
            <Link role="menuitem" to="/profile" className={row} onClick={() => setOpen(false)}><User className="size-4" /> My profile</Link>
            <Link role="menuitem" to="/my-projects" className={row} onClick={() => setOpen(false)}><FolderKanban className="size-4" /> My projects</Link>
            <Link role="menuitem" to="/settings" className={row} onClick={() => setOpen(false)}><Settings className="size-4" /> Settings</Link>
            <button role="menuitem" className={`${row} w-full text-destructive hover:bg-destructive/10`} onClick={() => { setOpen(false); onLogout() }}>
              <LogOut className="size-4" /> Logout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Topbar({ onOpenMenu }) {
  const { isDark, toggleTheme } = useTheme()
  const { user, isLoading, logout } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get('q') || '')

  const submit = (e) => {
    e.preventDefault()
    const term = q.trim()
    navigate(term ? `/?q=${encodeURIComponent(term)}` : '/')
  }

  return (
    <header className="sticky top-0 z-30 glass border-b">
      <div className="flex h-16 items-center gap-2 sm:gap-3 px-3 sm:px-6">
        <Button variant="outline" size="icon" className="lg:hidden" onClick={onOpenMenu} aria-label="Open menu">
          <Menu />
        </Button>

        <BackButton />

        <Link to="/" aria-label="Home">
          <Button variant="outline" size="sm"><Home /><span className="hidden sm:inline">Home</span></Button>
        </Link>

        <form onSubmit={submit} className="relative hidden md:block flex-1 max-w-md ml-2" role="search">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search projects, tech or students…"
            className="h-9 w-full rounded-full border bg-background/60 pl-9 pr-4 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/30"
          />
        </form>

        <div className="ml-auto flex items-center gap-2">
          <Link to="/upload">
            <Button size="sm" className="bg-brand-gradient animated-gradient text-white border-0 shadow-md shadow-primary/30 hover:opacity-90">
              <Plus /> <span className="hidden sm:inline">Upload project</span>
            </Button>
          </Link>

          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {isDark ? <Sun /> : <Moon />}
          </Button>

          {!isLoading && user && <UserMenu user={user} onLogout={() => { logout(); navigate('/login') }} />}
          {!isLoading && !user && (
            <div className="flex items-center gap-1">
              <Link to="/login"><Button size="sm" variant="ghost">Login</Button></Link>
              <Link to="/register" className="hidden sm:block"><Button size="sm" variant="outline">Register</Button></Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

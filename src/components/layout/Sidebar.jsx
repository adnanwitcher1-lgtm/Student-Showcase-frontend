import { NavLink, Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Home, Flame, Star, Clock, Clapperboard, Trophy, PlusCircle, FolderKanban, Bookmark,
  ShieldCheck, User, Settings, LogOut, Sparkles, PanelLeftClose, PanelLeftOpen, LogIn, UserPlus, X,
} from 'lucide-react'
import apiClient from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import Avatar from '@/components/Avatar'

function Section({ title, collapsed, children }) {
  return (
    <div className="mb-4">
      {!collapsed && (
        <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
          {title}
        </p>
      )}
      {collapsed && <div className="mx-3 mb-2 border-t border-sidebar-border" />}
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

function Item({ to, icon: Icon, label, collapsed, badge, onNavigate, matchSearch }) {
  const { pathname, search } = useLocation()
  const [path, query = ''] = to.split('?')
  const active = matchSearch
    ? pathname === path && search === `?${query}`
    : pathname === path && (path !== '/' || !search) && !(query === '' && search && path === '/my-projects')

  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
        active
          ? 'bg-brand-gradient text-white shadow-md shadow-primary/30'
          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:translate-x-0.5'
      } ${collapsed ? 'justify-center px-2' : ''}`}
    >
      <Icon className={`size-[18px] shrink-0 ${active ? '' : 'group-hover:scale-110 transition-transform'}`} />
      {!collapsed && <span className="truncate">{label}</span>}
      {!collapsed && badge > 0 && (
        <span className="ml-auto rounded-full bg-amber-400/90 text-amber-950 text-[10px] font-bold px-1.5 py-0.5 leading-none">
          {badge}
        </span>
      )}
      {collapsed && badge > 0 && <span className="absolute top-1 right-1 size-2 rounded-full bg-amber-400" />}
    </NavLink>
  )
}

export default function Sidebar({ collapsed, onToggle, onNavigate, mobile = false, onClose }) {
  const { user, isLoading, logout } = useAuth()
  const isStaff = user && ['instructor', 'admin'].includes(user.role)
  const c = collapsed && !mobile

  const { data: stats } = useQuery({
    queryKey: ['my-stats'],
    queryFn: async () => (await apiClient.get('/users/me/stats/')).data,
    enabled: Boolean(user),
    staleTime: 60 * 1000,
  })

  const { data: queue } = useQuery({
    queryKey: ['review-queue-count'],
    queryFn: async () => (await apiClient.get('/projects/', { params: { status: 'submitted' } })).data.count,
    enabled: Boolean(isStaff),
    staleTime: 60 * 1000,
  })

  const nav = (props) => <Item collapsed={c} onNavigate={onNavigate} {...props} />

  return (
    <aside
      className={`flex h-full flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-[width] duration-300 ${
        mobile ? 'w-72 animate-slide-in-left' : c ? 'w-[72px]' : 'w-64'
      }`}
    >
      {/* Brand */}
      <div className={`flex h-16 items-center gap-2 px-4 border-b border-sidebar-border ${c ? 'justify-center px-2' : ''}`}>
        <Link to="/" onClick={onNavigate} className="flex items-center gap-2.5 min-w-0">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-gradient animated-gradient shadow-lg shadow-primary/40">
            <Sparkles className="size-5 text-white" />
          </span>
          {!c && (
            <span className="font-bold leading-tight truncate">
              <span className="text-brand-gradient">Student</span> Showcase
            </span>
          )}
        </Link>
        {mobile && (
          <button onClick={onClose} className="ml-auto rounded-md p-1.5 hover:bg-sidebar-accent" aria-label="Close menu">
            <X className="size-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <Section title="Discover" collapsed={c}>
          {nav({ to: '/', icon: Home, label: 'Home' })}
          {nav({ to: '/?view=trending', icon: Flame, label: 'Trending', matchSearch: true })}
          {nav({ to: '/?view=featured', icon: Star, label: 'Featured', matchSearch: true })}
          {nav({ to: '/?view=latest', icon: Clock, label: 'Latest', matchSearch: true })}
          {nav({ to: '/?view=video', icon: Clapperboard, label: 'Video demos', matchSearch: true })}
          {nav({ to: '/leaderboard', icon: Trophy, label: 'Top creators' })}
        </Section>

        {user && (
          <Section title="Create" collapsed={c}>
            {nav({ to: '/upload', icon: PlusCircle, label: 'Upload project' })}
            {nav({ to: '/my-projects', icon: FolderKanban, label: 'My projects', badge: stats?.by_status?.submitted })}
            {nav({ to: '/my-projects?tab=bookmarks', icon: Bookmark, label: 'Saved', matchSearch: true })}
          </Section>
        )}

        {isStaff && (
          <Section title="Staff" collapsed={c}>
            {nav({ to: '/admin', icon: ShieldCheck, label: 'Review queue', badge: queue })}
          </Section>
        )}

        {user && (
          <Section title="Account" collapsed={c}>
            {nav({ to: '/profile', icon: User, label: 'Profile' })}
            {nav({ to: '/settings', icon: Settings, label: 'Settings' })}
          </Section>
        )}
      </nav>

      {/* Footer: user card / auth buttons */}
      <div className="border-t border-sidebar-border p-3 space-y-2">
        {!isLoading && user && (
          <>
            <Link
              to="/profile"
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-xl p-2 hover:bg-sidebar-accent transition-colors ${c ? 'justify-center' : ''}`}
              title={c ? user.username : undefined}
            >
              <Avatar src={user.avatar} name={user.username} size="md" />
              {!c && (
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{user.username}</p>
                  <p className="truncate text-xs text-muted-foreground capitalize">{user.role}{user.batch ? ` · ${user.batch}` : ''}</p>
                </div>
              )}
            </Link>
            <button
              onClick={() => { onNavigate?.(); logout() }}
              title={c ? 'Logout' : undefined}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors ${c ? 'justify-center px-2' : ''}`}
            >
              <LogOut className="size-[18px]" />
              {!c && 'Logout'}
            </button>
          </>
        )}

        {!isLoading && !user && (
          <div className={`space-y-1 ${c ? '' : ''}`}>
            {nav({ to: '/login', icon: LogIn, label: 'Login' })}
            {nav({ to: '/register', icon: UserPlus, label: 'Create account' })}
          </div>
        )}

        {!mobile && (
          <button
            onClick={onToggle}
            className="hidden lg:flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-sidebar-accent transition-colors justify-center"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen className="size-4" /> : <><PanelLeftClose className="size-4" /> Collapse</>}
          </button>
        )}
      </div>
    </aside>
  )
}

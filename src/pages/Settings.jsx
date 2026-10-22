import { useNavigate } from 'react-router-dom'
import { Moon, Sun, Zap, User, LogOut, Mail, ShieldCheck, Monitor } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import Avatar from '@/components/Avatar'

function Card({ title, icon: Icon, children }) {
  return (
    <section className="rounded-3xl border bg-card p-6">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <span className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary"><Icon className="size-4" /></span>
        {title}
      </h2>
      {children}
    </section>
  )
}

function Switch({ checked, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-muted-foreground/30'}`}
    >
      <span className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  )
}

export default function Settings() {
  const { isDark, setTheme, reduceMotion, setReduceMotion } = useTheme()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const themeBtn = (mode, Icon, label) => {
    const active = (mode === 'dark') === isDark
    return (
      <button
        onClick={() => setTheme(mode)}
        aria-pressed={active}
        className={`flex flex-1 flex-col items-center gap-2 rounded-2xl border p-4 text-sm font-medium transition-all ${
          active ? 'border-primary bg-primary/10 text-primary shadow-md shadow-primary/20' : 'hover:border-primary/50'
        }`}
      >
        <Icon className="size-6" /> {label}
      </button>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card title="Account" icon={User}>
        <div className="flex items-center gap-4">
          <Avatar src={user?.avatar} name={user?.username} size="lg" />
          <div className="min-w-0 text-sm">
            <p className="text-base font-semibold">{user?.username}</p>
            <p className="flex items-center gap-1.5 text-muted-foreground"><Mail className="size-3.5" /> {user?.email || 'No email added'}</p>
            <p className="flex items-center gap-1.5 text-muted-foreground capitalize"><ShieldCheck className="size-3.5" /> {user?.role}</p>
          </div>
          <Link to="/profile" className="ml-auto"><Button variant="outline" size="sm">Edit profile</Button></Link>
        </div>
      </Card>

      <Card title="Appearance" icon={Monitor}>
        <div className="flex gap-3">
          {themeBtn('dark', Moon, 'Dark')}
          {themeBtn('light', Sun, 'Light')}
        </div>
        <div className="mt-5 flex items-center justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium"><Zap className="size-4" /> Reduce motion</p>
            <p className="text-xs text-muted-foreground">Turns off animations and moving backgrounds.</p>
          </div>
          <Switch checked={reduceMotion} onChange={setReduceMotion} label="Reduce motion" />
        </div>
      </Card>

      <Card title="Session" icon={LogOut}>
        <p className="mb-3 text-sm text-muted-foreground">Sign out of Student Showcase on this device.</p>
        <Button variant="destructive" onClick={() => { logout(); navigate('/login') }}>
          <LogOut /> Logout
        </Button>
      </Card>
    </div>
  )
}

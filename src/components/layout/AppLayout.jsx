import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

function readCollapsed() {
  try { return localStorage.getItem('sidebar_collapsed') === '1' } catch { return false }
}

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const [drawer, setDrawer] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    try { localStorage.setItem('sidebar_collapsed', collapsed ? '1' : '0') } catch { /* ignore */ }
  }, [collapsed])

  // Close the mobile drawer and scroll to top on navigation
  useEffect(() => {
    setDrawer(false)
    window.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div className="min-h-screen">
      <div className="aurora" aria-hidden="true" />

      {/* Desktop sidebar */}
      <div className="hidden lg:block fixed inset-y-0 left-0 z-40">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      </div>

      {/* Mobile drawer */}
      {drawer && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 animate-fade-in" onClick={() => setDrawer(false)} />
          <div className="relative h-full">
            <Sidebar mobile onNavigate={() => setDrawer(false)} onClose={() => setDrawer(false)} />
          </div>
        </div>
      )}

      <div className={`transition-[padding] duration-300 ${collapsed ? 'lg:pl-[72px]' : 'lg:pl-64'}`}>
        <Topbar onOpenMenu={() => setDrawer(true)} />
        <main key={pathname} className="page">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

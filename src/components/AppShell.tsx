import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  ClipboardList,
  Eye,
  Glasses,
  LayoutDashboard,
  LogOut,
  Menu,
  Sparkles,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { canAccessPath, ROLE_LABELS } from '../lib/status'
import type { UserRole } from '../types'

const NAV = [
  { to: '/app/recepcion', label: 'Recepción', icon: ClipboardList },
  { to: '/app/graduacion', label: 'Graduación', icon: Eye },
  { to: '/app/optico', label: 'Óptico', icon: Glasses },
  { to: '/app/panel', label: 'Panel', icon: LayoutDashboard },
] as const

function visibleNav(role: UserRole) {
  return NAV.filter((item) => canAccessPath(role, item.to))
}

export function AppShell() {
  const { profile, signOut, isDemoMode } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  if (!profile) return null

  const items = visibleNav(profile.role)

  const onLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
      isActive
        ? 'bg-[var(--signal)] text-[var(--ink)] shadow-[0_8px_20px_rgba(0,194,168,0.25)]'
        : 'text-slate-300 hover:bg-white/8 hover:text-white'
    }`

  const sidebar = (
    <aside className="mesh-panel flex h-full min-h-screen w-[272px] flex-col bg-[linear-gradient(165deg,#0b1220_0%,#15233a_55%,#0f1b2d_100%)] text-white">
      <div className="relative z-10 border-b border-white/10 px-5 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--signal)] text-[var(--ink)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-xl font-bold tracking-tight">Visualops</p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
              Campañas ópticas
            </p>
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <p className="text-sm font-semibold">{profile.full_name}</p>
          <p className="text-xs text-slate-400">{ROLE_LABELS[profile.role]}</p>
        </div>
        {isDemoMode && (
          <p className="mt-3 rounded-lg bg-[rgba(255,138,61,0.15)] px-2.5 py-1.5 text-[11px] font-medium text-[#ffd1b0]">
            Modo demo · datos en este navegador
          </p>
        )}
      </div>
      <nav className="relative z-10 flex-1 space-y-1 px-3 py-4">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={linkClass}
            onClick={() => setOpen(false)}
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="relative z-10 border-t border-white/10 p-3">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 hover:bg-white/8 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )

  return (
    <div className="min-h-screen md:flex">
      <div className="sticky top-0 hidden h-screen md:block">{sidebar}</div>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[rgba(11,18,32,0.55)] backdrop-blur-sm"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-50 h-full w-[272px]">{sidebar}</div>
        </div>
      )}

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-[var(--line)] bg-[rgba(247,249,252,0.85)] px-4 py-3 backdrop-blur md:hidden">
          <div>
            <p className="font-display text-lg font-bold">Visualops</p>
            <p className="text-[11px] text-slate-500">{ROLE_LABELS[profile.role]}</p>
          </div>
          <button
            type="button"
            className="rounded-xl border border-[var(--line)] bg-white p-2"
            onClick={() => setOpen(true)}
            aria-label="Menú"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>
        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

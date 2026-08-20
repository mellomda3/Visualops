import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  ClipboardList,
  Eye,
  Glasses,
  LayoutDashboard,
  LogOut,
  Menu,
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
    `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
      isActive
        ? 'bg-[var(--signal)] text-[var(--ink)] shadow-[0_10px_24px_rgba(0,194,168,0.28)]'
        : 'text-slate-300 hover:bg-white/8 hover:text-white'
    }`

  const sidebar = (
    <aside className="mesh-panel flex h-full min-h-screen w-[280px] flex-col bg-[linear-gradient(165deg,#07101c_0%,#13233a_52%,#0c1828_100%)] text-white">
      <div className="relative z-10 border-b border-white/10 px-5 py-7">
        <div className="flex items-center gap-3">
          <div className="brand-mark flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--signal)] text-[var(--ink)]">
            <span className="font-display text-lg font-extrabold">V</span>
          </div>
          <div>
            <p className="font-display text-2xl font-extrabold tracking-tight">
              Visualops
            </p>
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
              Operativo óptico
            </p>
          </div>
        </div>
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 backdrop-blur-sm">
          <p className="text-sm font-semibold">{profile.full_name}</p>
          <p className="mt-0.5 text-xs text-[var(--signal)]">
            {ROLE_LABELS[profile.role]}
          </p>
        </div>
        {isDemoMode && (
          <p className="mt-3 rounded-lg bg-[rgba(255,138,61,0.16)] px-2.5 py-1.5 text-[11px] font-medium text-[#ffd1b0]">
            Modo demo · datos en este navegador
          </p>
        )}
      </div>
      <nav className="relative z-10 flex-1 space-y-1.5 px-3 py-5">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={linkClass}
            onClick={() => setOpen(false)}
          >
            <Icon className="h-4 w-4 opacity-90" />
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
    <div className="app-canvas min-h-screen md:flex">
      <div className="sticky top-0 hidden h-screen md:block">{sidebar}</div>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[rgba(7,16,28,0.6)] backdrop-blur-sm"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-50 h-full w-[280px] shadow-2xl">
            {sidebar}
          </div>
        </div>
      )}

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-[var(--line)] bg-[rgba(247,249,252,0.9)] px-4 py-3 backdrop-blur md:hidden">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--ink)] text-[var(--signal)]">
              <span className="font-display text-sm font-extrabold">V</span>
            </div>
            <div>
              <p className="font-display text-lg font-extrabold">Visualops</p>
              <p className="text-[11px] text-slate-500">
                {ROLE_LABELS[profile.role]}
              </p>
            </div>
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

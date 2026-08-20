import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { homePathForRole } from '../lib/status'
import { Alert, Button, Field, Label } from '../components/ui'

export function LoginPage() {
  const { profile, loading, signIn, isDemoMode } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState(
    isDemoMode ? 'admin@visualops.local' : '',
  )
  const [password, setPassword] = useState(isDemoMode ? 'demo1234' : '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!loading && profile) {
    return <Navigate to={homePathForRole(profile.role)} replace />
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await signIn(email.trim(), password)
      navigate('/app')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-stage relative flex min-h-screen overflow-hidden">
      <div className="login-glow login-glow-a" aria-hidden />
      <div className="login-glow login-glow-b" aria-hidden />
      <div className="login-grid" aria-hidden />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-10 px-5 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:px-8">
        <div className="page-enter text-white">
          <p className="font-display text-5xl font-extrabold tracking-tight md:text-7xl">
            Visualops
          </p>
          <h1 className="mt-5 max-w-xl font-display text-2xl font-bold leading-snug text-white/95 md:text-3xl">
            El ritmo de la campaña, de recepción a entrega
          </h1>
          <p className="mt-4 max-w-md text-base text-slate-300">
            Un solo flujo para puestos en terreno y oficina: fichas, recetas,
            pedidos y panel.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="page-enter surface-card relative overflow-hidden p-7 md:p-8"
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(0,194,168,0.22),transparent_70%)]" />
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--signal-deep)]">
              Acceso
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold">Entrar</h2>
            <p className="mt-1 text-sm text-slate-500">
              Usá la cuenta de tu puesto
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <Label>Email</Label>
                <Field
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
              <div>
                <Label>Contraseña</Label>
                <Field
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && <Alert tone="error">{error}</Alert>}

              <Button type="submit" disabled={busy} className="w-full">
                {busy ? 'Entrando…' : 'Entrar al operativo'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            {isDemoMode && (
              <div className="mt-6 rounded-xl border border-[var(--line)] bg-[var(--mist)]/80 p-3 text-xs text-slate-600">
                <p className="font-semibold text-[var(--ink)]">Cuentas demo</p>
                <p className="mt-1">admin@visualops.local · demo1234</p>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

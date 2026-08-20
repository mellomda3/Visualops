import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, ShieldCheck } from 'lucide-react'
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
    <div className="relative flex min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,194,168,0.22),transparent_34%),radial-gradient(circle_at_80%_0%,rgba(255,138,61,0.18),transparent_30%),linear-gradient(135deg,#0b1220,#15233a_45%,#0f1b2d)]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:28px_28px]" />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col justify-center gap-10 px-4 py-10 lg:flex-row lg:items-center lg:gap-16">
        <div className="page-enter max-w-xl text-white">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--signal)]">
            Visualops
          </p>
          <h1 className="mt-3 font-display text-4xl font-extrabold leading-tight md:text-5xl">
            Operativos ópticos con ritmo de campaña
          </h1>
          <p className="mt-4 max-w-lg text-base text-slate-300">
            Recepción, graduación, taller y panel en un solo flujo. Pensado para
            puestos en terreno, no para escritorios eternos.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-300">
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">
              Fichas correlativas
            </span>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">
              Estados claros
            </span>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">
              Export + WhatsApp
            </span>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="page-enter surface-card w-full max-w-md p-7"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-[var(--ink)] p-2 text-[var(--signal)]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold">Ingresar</h2>
              <p className="text-sm text-slate-500">Tu puesto de trabajo</p>
            </div>
          </div>

          <div className="space-y-4">
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
            <div className="mt-6 rounded-xl bg-[var(--mist)] p-3 text-xs text-slate-600">
              <p className="font-semibold text-[var(--ink)]">Cuentas demo</p>
              <p className="mt-1">admin@visualops.local</p>
              <p>recepcion@visualops.local · graduacion@visualops.local</p>
              <p>optico@visualops.local</p>
              <p className="mt-1 font-medium">Contraseña: demo1234</p>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

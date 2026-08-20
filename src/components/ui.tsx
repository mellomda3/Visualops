import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 page-enter">
      <div>
        {eyebrow && (
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.22em] text-[var(--signal-deep)]">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-3xl font-extrabold text-[var(--ink)] md:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 md:text-base">
            {description}
          </p>
        )}
        <div className="mt-3 h-1 w-16 rounded-full bg-[linear-gradient(90deg,var(--signal),var(--flare))]" />
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`surface-card ${className}`}>{children}</div>
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="rounded-[18px] border border-dashed border-[var(--line)] bg-white/70 px-6 py-10 text-center">
      <p className="font-display text-xl font-bold text-[var(--ink)]">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">{description}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ink' | 'ghost' | 'danger'
}) {
  return (
    <button
      className={`btn btn-${variant} ${className}`}
      {...props}
    />
  )
}

export function Field(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`field ${props.className ?? ''}`} {...props} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`field ${props.className ?? ''}`} {...props} />
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`field ${props.className ?? ''}`} {...props} />
}

export function Label({
  children,
  hint,
}: {
  children: ReactNode
  hint?: string
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-slate-700">{children}</span>
      {hint && <span className="mb-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  )
}

export function Alert({
  tone = 'ok',
  children,
}: {
  tone?: 'ok' | 'error' | 'info'
  children: ReactNode
}) {
  const styles =
    tone === 'ok'
      ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
      : tone === 'error'
        ? 'bg-rose-50 text-rose-800 border-rose-200'
        : 'bg-sky-50 text-sky-900 border-sky-200'
  return (
    <p className={`rounded-xl border px-3 py-2 text-sm ${styles}`}>{children}</p>
  )
}

export function StatCard({
  label,
  value,
  accent,
}: {
  label: string
  value: number | string
  accent?: boolean
}) {
  return (
    <div
      className={`surface-card px-4 py-4 ${accent ? 'stat-glow border-[var(--signal)]' : ''}`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl font-bold text-[var(--ink)]">{value}</p>
    </div>
  )
}

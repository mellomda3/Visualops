import { STATUS_LABELS } from '../lib/status'
import type { RecordStatus } from '../types'

const COLORS: Record<RecordStatus, string> = {
  precargada: 'bg-slate-200 text-slate-800',
  graduada: 'bg-cyan-100 text-cyan-900',
  pendiente: 'bg-amber-100 text-amber-950',
  confirmada: 'bg-emerald-100 text-emerald-900',
  entregada: 'bg-teal-100 text-teal-950',
  cancelada: 'bg-rose-100 text-rose-900',
}

export function StatusBadge({ status }: { status: RecordStatus }) {
  return (
    <span className={`chip ${COLORS[status]}`}>{STATUS_LABELS[status]}</span>
  )
}

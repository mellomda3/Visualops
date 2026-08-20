import { STATUS_LABELS } from '../lib/status'
import type { RecordStatus } from '../types'

const COLORS: Record<RecordStatus, string> = {
  precargada: 'bg-[#e8eef5] text-[#1c2a3f] ring-1 ring-[#c9d5e4]',
  graduada: 'bg-[#d9f7f2] text-[#065f54] ring-1 ring-[#9ae6d8]',
  pendiente: 'bg-[#fff1df] text-[#9a5b00] ring-1 ring-[#f0c990]',
  confirmada: 'bg-[#e3f7ec] text-[#146c43] ring-1 ring-[#9fd9b8]',
  entregada: 'bg-[#d7f0ff] text-[#0b5f8a] ring-1 ring-[#9dcfeb]',
  cancelada: 'bg-[#ffe4e4] text-[#9f1d1d] ring-1 ring-[#f0b4b4]',
}

export function StatusBadge({ status }: { status: RecordStatus }) {
  return (
    <span className={`chip ${COLORS[status]}`}>{STATUS_LABELS[status]}</span>
  )
}

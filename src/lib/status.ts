import type { RecordStatus, UserRole } from '../types'

export const STATUS_LABELS: Record<RecordStatus, string> = {
  precargada: 'Precargada',
  graduada: 'Graduada',
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  entregada: 'Entregada',
  cancelada: 'Cancelada',
}

export const STATUS_FLOW: RecordStatus[] = [
  'precargada',
  'graduada',
  'pendiente',
  'confirmada',
  'entregada',
]

export const OPTICO_STATUSES: RecordStatus[] = [
  'graduada',
  'pendiente',
  'confirmada',
  'entregada',
]

export function canTransition(from: RecordStatus, to: RecordStatus): boolean {
  if (to === 'cancelada') return from !== 'entregada' && from !== 'cancelada'
  if (from === 'cancelada' || from === 'entregada') return false
  const fromIdx = STATUS_FLOW.indexOf(from)
  const toIdx = STATUS_FLOW.indexOf(to)
  if (fromIdx === -1 || toIdx === -1) return false
  return toIdx === fromIdx || toIdx === fromIdx + 1
}

export function homePathForRole(role: UserRole): string {
  switch (role) {
    case 'recepcion':
      return '/app/recepcion'
    case 'graduador':
      return '/app/graduacion'
    case 'optico':
      return '/app/optico'
    case 'admin':
      return '/app/panel'
    default: {
      const _exhaustive: never = role
      return _exhaustive
    }
  }
}

export function canAccessPath(role: UserRole, path: string): boolean {
  if (role === 'admin') return true
  if (path.startsWith('/app/recepcion')) return role === 'recepcion'
  if (path.startsWith('/app/graduacion')) return role === 'graduador'
  if (path.startsWith('/app/optico')) return role === 'optico'
  if (path.startsWith('/app/panel')) return false
  return false
}

export const ROLE_LABELS: Record<UserRole, string> = {
  recepcion: 'Recepción',
  graduador: 'Graduación',
  optico: 'Óptico',
  admin: 'Administración',
}

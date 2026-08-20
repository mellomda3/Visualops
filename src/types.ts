export type UserRole = 'recepcion' | 'graduador' | 'optico' | 'admin'

export type RecordStatus =
  | 'precargada'
  | 'graduada'
  | 'pendiente'
  | 'confirmada'
  | 'entregada'
  | 'cancelada'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
}

export interface Campaign {
  id: string
  organization_id?: string
  name: string
  location: string
  date: string
  created_at: string
}

export interface Refraction {
  id: string
  record_id: string
  od_sph: number | null
  od_cyl: number | null
  od_axis: number | null
  os_sph: number | null
  os_cyl: number | null
  os_axis: number | null
  add_power: number | null
  dnp: number | null
  notes: string | null
  created_at: string
}

export interface Order {
  id: string
  record_id: string
  lens: string | null
  frame: string | null
  treatment: string | null
  color: string | null
  shape: string | null
  distance: string | null
  total: number
  deposit: number
  balance: number
  created_at: string
  updated_at: string
}

export type FileKind = 'receta' | 'historia' | 'dni' | 'armazon' | 'otro'

export interface RecordFile {
  id: string
  record_id: string
  path: string
  name: string
  mime_type?: string
  size_bytes?: number
  kind?: FileKind
  created_at: string
}

export interface PatientRecord {
  id: string
  campaign_id: string
  ficha_nro: string
  status: RecordStatus
  full_name: string
  phone: string
  age: number | null
  street: string
  city: string
  insurance: string
  recipe_nro: string
  appointment_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  campaigns?: Campaign | null
  refractions?: Refraction | null
  orders?: Order | null
  files?: RecordFile[]
}

export type PatientRecordInput = {
  campaign_id: string
  full_name: string
  phone: string
  age: number | null
  street: string
  city: string
  insurance: string
  recipe_nro: string
  appointment_at: string | null
}

export type RefractionInput = Omit<Refraction, 'id' | 'record_id' | 'created_at'>

export type OrderInput = {
  lens: string | null
  frame: string | null
  treatment: string | null
  color: string | null
  shape: string | null
  distance: string | null
  total: number
  deposit: number
  status?: RecordStatus
}

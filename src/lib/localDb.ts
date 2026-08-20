import type {
  Campaign,
  FileKind,
  Order,
  OrderInput,
  PatientRecord,
  PatientRecordInput,
  Profile,
  RecordFile,
  RecordStatus,
  Refraction,
  RefractionInput,
  UserRole,
} from '../types'
import { assertTransition } from './status'

const STORAGE_KEY = 'visualops.demo.v2'

interface DemoDb {
  profiles: Profile[]
  campaigns: Campaign[]
  counters: Record<string, number>
  records: PatientRecord[]
  refractions: Refraction[]
  orders: Order[]
  files: RecordFile[]
  sessionUserId: string | null
}

const DEMO_PASSWORD = 'demo1234'

function uid(): string {
  return crypto.randomUUID()
}

function nowIso(): string {
  return new Date().toISOString()
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function seed(): DemoDb {
  const adminId = uid()
  const recepcionId = uid()
  const graduadorId = uid()
  const opticoId = uid()
  const campaignA = uid()
  const campaignB = uid()
  const today = new Date().toISOString().slice(0, 10)

  const r1 = uid()
  const r2 = uid()
  const r3 = uid()
  const r4 = uid()
  const r5 = uid()

  return {
    profiles: [
      {
        id: adminId,
        email: 'admin@visualops.local',
        full_name: 'Admin Visualops',
        role: 'admin',
      },
      {
        id: recepcionId,
        email: 'recepcion@visualops.local',
        full_name: 'María Recepción',
        role: 'recepcion',
      },
      {
        id: graduadorId,
        email: 'graduacion@visualops.local',
        full_name: 'Luis Graduador',
        role: 'graduador',
      },
      {
        id: opticoId,
        email: 'optico@visualops.local',
        full_name: 'Ana Óptica',
        role: 'optico',
      },
    ],
    campaigns: [
      {
        id: campaignA,
        name: 'Operativo Plaza Central',
        location: 'Corrientes Capital',
        date: today,
        created_at: nowIso(),
      },
      {
        id: campaignB,
        name: 'Ruta Norte Agosto',
        location: 'Virasoro',
        date: daysAgo(3).slice(0, 10),
        created_at: daysAgo(4),
      },
    ],
    counters: { [campaignA]: 2, [campaignB]: 3 },
    records: [
      {
        id: r1,
        campaign_id: campaignA,
        ficha_nro: '0001',
        status: 'precargada',
        full_name: 'García Lucía',
        phone: '3794123456',
        age: 34,
        street: 'San Martín 450',
        city: 'Corrientes',
        insurance: 'IAPOS',
        recipe_nro: 'R-1022',
        appointment_at: `${today}T09:30:00.000Z`,
        created_by: recepcionId,
        created_at: nowIso(),
        updated_at: nowIso(),
      },
      {
        id: r2,
        campaign_id: campaignA,
        ficha_nro: '0002',
        status: 'graduada',
        full_name: 'Pérez Jorge',
        phone: '3794987654',
        age: 52,
        street: 'Belgrano 120',
        city: 'Corrientes',
        insurance: 'PAMI',
        recipe_nro: 'R-1023',
        appointment_at: `${today}T10:15:00.000Z`,
        created_by: recepcionId,
        created_at: daysAgo(0),
        updated_at: daysAgo(0),
      },
      {
        id: r3,
        campaign_id: campaignB,
        ficha_nro: '0001',
        status: 'pendiente',
        full_name: 'Ramírez Elena',
        phone: '3756123000',
        age: 41,
        street: 'Rivadavia 88',
        city: 'Virasoro',
        insurance: 'OSDE',
        recipe_nro: 'R-880',
        appointment_at: daysAgo(3),
        created_by: recepcionId,
        created_at: daysAgo(3),
        updated_at: daysAgo(2),
      },
      {
        id: r4,
        campaign_id: campaignB,
        ficha_nro: '0002',
        status: 'confirmada',
        full_name: 'Acosta Martín',
        phone: '3756555123',
        age: 29,
        street: 'Mitre 210',
        city: 'Virasoro',
        insurance: 'Particular',
        recipe_nro: 'R-881',
        appointment_at: daysAgo(3),
        created_by: recepcionId,
        created_at: daysAgo(3),
        updated_at: daysAgo(1),
      },
      {
        id: r5,
        campaign_id: campaignB,
        ficha_nro: '0003',
        status: 'entregada',
        full_name: 'Benítez Rosa',
        phone: '3756444000',
        age: 63,
        street: 'Sarmiento 15',
        city: 'Virasoro',
        insurance: 'PAMI',
        recipe_nro: 'R-882',
        appointment_at: daysAgo(4),
        created_by: recepcionId,
        created_at: daysAgo(4),
        updated_at: daysAgo(1),
      },
    ],
    refractions: [
      {
        id: uid(),
        record_id: r2,
        od_sph: -1.25,
        od_cyl: -0.5,
        od_axis: 90,
        os_sph: -1.5,
        os_cyl: -0.75,
        os_axis: 85,
        add_power: 1.5,
        dnp: 62,
        notes: 'Leve astigmatismo',
        created_at: nowIso(),
      },
      {
        id: uid(),
        record_id: r3,
        od_sph: 2.0,
        od_cyl: -0.25,
        od_axis: 180,
        os_sph: 1.75,
        os_cyl: 0,
        os_axis: 0,
        add_power: 2.0,
        dnp: 64,
        notes: null,
        created_at: daysAgo(2),
      },
      {
        id: uid(),
        record_id: r4,
        od_sph: -0.75,
        od_cyl: -1.0,
        od_axis: 10,
        os_sph: -0.5,
        os_cyl: -0.75,
        os_axis: 170,
        add_power: null,
        dnp: 63,
        notes: 'Uso diario',
        created_at: daysAgo(2),
      },
      {
        id: uid(),
        record_id: r5,
        od_sph: 1.25,
        od_cyl: -0.5,
        od_axis: 80,
        os_sph: 1.0,
        os_cyl: -0.25,
        os_axis: 95,
        add_power: 2.25,
        dnp: 61,
        notes: 'Progresivos',
        created_at: daysAgo(3),
      },
    ],
    orders: [
      {
        id: uid(),
        record_id: r3,
        lens: 'Organic 1.56',
        frame: 'Metal clásico',
        treatment: 'Antireflejo',
        color: 'Negro',
        shape: 'Rectangular',
        distance: 'Lejos',
        total: 130000,
        deposit: 20000,
        balance: 110000,
        created_at: daysAgo(2),
        updated_at: daysAgo(2),
      },
      {
        id: uid(),
        record_id: r4,
        lens: 'Policarbonato',
        frame: 'Acetato carey',
        treatment: 'Blue light',
        color: 'Carey',
        shape: 'Redondo',
        distance: 'Lejos',
        total: 170000,
        deposit: 70000,
        balance: 100000,
        created_at: daysAgo(1),
        updated_at: daysAgo(1),
      },
      {
        id: uid(),
        record_id: r5,
        lens: 'Progresivo 1.67',
        frame: 'Flex titanio',
        treatment: 'Antireflejo + UV',
        color: 'Gris',
        shape: 'Aviador',
        distance: 'Multifocal',
        total: 210000,
        deposit: 210000,
        balance: 0,
        created_at: daysAgo(2),
        updated_at: daysAgo(1),
      },
    ],
    files: [],
    sessionUserId: null,
  }
}

function load(): DemoDb {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    const db = seed()
    save(db)
    return db
  }
  try {
    return JSON.parse(raw) as DemoDb
  } catch {
    const db = seed()
    save(db)
    return db
  }
}

function save(db: DemoDb): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
}

function withRelations(db: DemoDb, record: PatientRecord): PatientRecord {
  const order = db.orders.find((o) => o.record_id === record.id)
  return {
    ...record,
    campaigns: db.campaigns.find((c) => c.id === record.campaign_id) ?? null,
    refractions: db.refractions.find((r) => r.record_id === record.id) ?? null,
    orders: order
      ? { ...order, balance: order.total - order.deposit }
      : null,
    files: db.files.filter((f) => f.record_id === record.id),
  }
}

export const demoAuth = {
  async signIn(email: string, password: string): Promise<Profile> {
    if (password !== DEMO_PASSWORD) {
      throw new Error('Credenciales inválidas (modo demo: password demo1234)')
    }
    const db = load()
    const profile = db.profiles.find(
      (p) => p.email.toLowerCase() === email.toLowerCase(),
    )
    if (!profile) {
      throw new Error(
        'Usuario no encontrado. Probá admin@visualops.local / demo1234',
      )
    }
    db.sessionUserId = profile.id
    save(db)
    return profile
  },

  async signOut(): Promise<void> {
    const db = load()
    db.sessionUserId = null
    save(db)
  },

  async getSession(): Promise<Profile | null> {
    const db = load()
    if (!db.sessionUserId) return null
    return db.profiles.find((p) => p.id === db.sessionUserId) ?? null
  },
}

export const demoApi = {
  async listCampaigns(): Promise<Campaign[]> {
    return load().campaigns.sort((a, b) => b.date.localeCompare(a.date))
  },

  async createCampaign(input: {
    name: string
    location: string
    date: string
  }): Promise<Campaign> {
    const db = load()
    const campaign: Campaign = {
      id: uid(),
      name: input.name.trim(),
      location: input.location.trim(),
      date: input.date,
      created_at: nowIso(),
    }
    db.campaigns.push(campaign)
    db.counters[campaign.id] = 0
    save(db)
    return campaign
  },

  async listRecords(filters?: {
    status?: RecordStatus | 'todos'
    campaignId?: string | 'todos'
    date?: string | 'todos'
    query?: string
  }): Promise<PatientRecord[]> {
    const db = load()
    let rows = db.records.map((r) => withRelations(db, r))

    if (filters?.status && filters.status !== 'todos') {
      rows = rows.filter((r) => r.status === filters.status)
    }
    if (filters?.campaignId && filters.campaignId !== 'todos') {
      rows = rows.filter((r) => r.campaign_id === filters.campaignId)
    }
    if (filters?.date && filters.date !== 'todos') {
      rows = rows.filter((r) => {
        const d = (r.appointment_at ?? r.created_at).slice(0, 10)
        return d === filters.date
      })
    }
    if (filters?.query?.trim()) {
      const q = filters.query.trim().toLowerCase()
      rows = rows.filter(
        (r) =>
          r.full_name.toLowerCase().includes(q) ||
          r.ficha_nro.toLowerCase().includes(q) ||
          r.phone.toLowerCase().includes(q) ||
          (r.campaigns?.name ?? '').toLowerCase().includes(q),
      )
    }

    return rows.sort((a, b) => b.created_at.localeCompare(a.created_at))
  },

  async createRecord(
    input: PatientRecordInput,
    createdBy: string | null,
  ): Promise<PatientRecord> {
    const db = load()
    const next = (db.counters[input.campaign_id] ?? 0) + 1
    db.counters[input.campaign_id] = next
    const record: PatientRecord = {
      id: uid(),
      campaign_id: input.campaign_id,
      ficha_nro: String(next).padStart(4, '0'),
      status: 'precargada',
      full_name: input.full_name.trim(),
      phone: input.phone.trim(),
      age: input.age,
      street: input.street.trim(),
      city: input.city.trim(),
      insurance: input.insurance.trim(),
      recipe_nro: input.recipe_nro.trim(),
      appointment_at: input.appointment_at,
      created_by: createdBy,
      created_at: nowIso(),
      updated_at: nowIso(),
    }
    db.records.push(record)
    save(db)
    return withRelations(db, record)
  },

  async updateRecord(
    recordId: string,
    patch: Partial<PatientRecordInput> & { status?: RecordStatus },
  ): Promise<PatientRecord> {
    const db = load()
    const record = db.records.find((r) => r.id === recordId)
    if (!record) throw new Error('Ficha no encontrada')
    if (patch.status) assertTransition(record.status, patch.status)
    Object.assign(record, {
      ...patch,
      updated_at: nowIso(),
    })
    save(db)
    return withRelations(db, record)
  },

  async deleteRecord(recordId: string): Promise<void> {
    const db = load()
    db.records = db.records.filter((r) => r.id !== recordId)
    db.refractions = db.refractions.filter((r) => r.record_id !== recordId)
    db.orders = db.orders.filter((o) => o.record_id !== recordId)
    db.files = db.files.filter((f) => f.record_id !== recordId)
    save(db)
  },

  async saveRefraction(
    recordId: string,
    input: RefractionInput,
  ): Promise<Refraction> {
    const db = load()
    const existing = db.refractions.find((r) => r.record_id === recordId)
    const refraction: Refraction = existing
      ? { ...existing, ...input }
      : {
          id: uid(),
          record_id: recordId,
          created_at: nowIso(),
          ...input,
        }
    if (existing) {
      Object.assign(existing, input)
    } else {
      db.refractions.push(refraction)
    }
    const record = db.records.find((r) => r.id === recordId)
    if (record && (record.status === 'precargada' || record.status === 'graduada')) {
      record.status = 'graduada'
      record.updated_at = nowIso()
    }
    save(db)
    return refraction
  },

  async saveOrder(recordId: string, input: OrderInput): Promise<Order> {
    const db = load()
    const balance = input.total - input.deposit
    const existing = db.orders.find((o) => o.record_id === recordId)
    const order: Order = existing
      ? {
          ...existing,
          ...input,
          balance,
          updated_at: nowIso(),
        }
      : {
          id: uid(),
          record_id: recordId,
          lens: input.lens,
          frame: input.frame,
          treatment: input.treatment,
          color: input.color,
          shape: input.shape,
          distance: input.distance,
          total: input.total,
          deposit: input.deposit,
          balance,
          created_at: nowIso(),
          updated_at: nowIso(),
        }

    if (existing) {
      Object.assign(existing, order)
    } else {
      db.orders.push(order)
    }

    const record = db.records.find((r) => r.id === recordId)
    if (record) {
      const nextStatus =
        input.status ??
        (record.status === 'graduada' ? 'pendiente' : record.status)
      assertTransition(record.status, nextStatus)
      record.status = nextStatus
      record.updated_at = nowIso()
    }
    save(db)
    return order
  },

  async addFile(
    recordId: string,
    name: string,
    dataUrl: string,
    kind: FileKind = 'otro',
  ): Promise<RecordFile> {
    const db = load()
    const file: RecordFile = {
      id: uid(),
      record_id: recordId,
      path: dataUrl,
      name,
      mime_type: 'application/octet-stream',
      size_bytes: 0,
      kind,
      created_at: nowIso(),
    }
    db.files.push(file)
    save(db)
    return file
  },

  async deleteFile(fileId: string): Promise<void> {
    const db = load()
    db.files = db.files.filter((f) => f.id !== fileId)
    save(db)
  },

  async getProfile(userId: string): Promise<Profile | null> {
    return load().profiles.find((p) => p.id === userId) ?? null
  },

  async listProfiles(): Promise<Profile[]> {
    return load().profiles
  },

  async updateProfileRole(userId: string, role: UserRole): Promise<void> {
    const db = load()
    const profile = db.profiles.find((p) => p.id === userId)
    if (!profile) throw new Error('Perfil no encontrado')
    profile.role = role
    save(db)
  },

  async getStats(): Promise<Record<RecordStatus | 'total', number>> {
    const rows = load().records
    const base: Record<RecordStatus | 'total', number> = {
      total: rows.length,
      precargada: 0,
      graduada: 0,
      pendiente: 0,
      confirmada: 0,
      entregada: 0,
      cancelada: 0,
    }
    for (const r of rows) base[r.status] += 1
    return base
  },

  reset(): void {
    localStorage.removeItem(STORAGE_KEY)
    load()
  },
}

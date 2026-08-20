import { demoApi, demoAuth } from './localDb'
import { isDemoMode, supabase } from './supabase'
import type {
  Campaign,
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

function requireSupabase() {
  if (!supabase) throw new Error('Supabase no configurado')
  return supabase
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  if (isDemoMode) return demoApi.getProfile(userId)
  const client = requireSupabase()
  const { data, error } = await client
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data as Profile | null
}

export const authApi = {
  async signIn(email: string, password: string): Promise<Profile> {
    if (isDemoMode) return demoAuth.signIn(email, password)
    const client = requireSupabase()
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    if (!data.user) throw new Error('No se pudo iniciar sesión')
    const profile = await fetchProfile(data.user.id)
    if (!profile) throw new Error('Perfil no encontrado')
    return profile
  },

  async signOut(): Promise<void> {
    if (isDemoMode) return demoAuth.signOut()
    const { error } = await requireSupabase().auth.signOut()
    if (error) throw error
  },

  async getSessionProfile(): Promise<Profile | null> {
    if (isDemoMode) return demoAuth.getSession()
    const client = requireSupabase()
    const { data, error } = await client.auth.getSession()
    if (error) throw error
    if (!data.session?.user) return null
    return fetchProfile(data.session.user.id)
  },
}

function mapRecord(row: PatientRecord & {
  campaigns?: Campaign | Campaign[] | null
  refractions?: Refraction | Refraction[] | null
  orders?: Order | Order[] | null
  files?: RecordFile[] | null
}): PatientRecord {
  const campaign = Array.isArray(row.campaigns)
    ? row.campaigns[0] ?? null
    : row.campaigns ?? null
  const refraction = Array.isArray(row.refractions)
    ? row.refractions[0] ?? null
    : row.refractions ?? null
  const order = Array.isArray(row.orders)
    ? row.orders[0] ?? null
    : row.orders ?? null

  return {
    ...row,
    campaigns: campaign,
    refractions: refraction,
    orders: order,
    files: row.files ?? [],
  }
}

const RECORD_SELECT = `
  *,
  campaigns (*),
  refractions (*),
  orders (*),
  files (*)
`

export const dataApi = {
  async listCampaigns(): Promise<Campaign[]> {
    if (isDemoMode) return demoApi.listCampaigns()
    const { data, error } = await requireSupabase()
      .from('campaigns')
      .select('*')
      .order('date', { ascending: false })
    if (error) throw error
    return (data ?? []) as Campaign[]
  },

  async createCampaign(input: {
    name: string
    location: string
    date: string
  }): Promise<Campaign> {
    if (isDemoMode) return demoApi.createCampaign(input)
    const { data, error } = await requireSupabase()
      .from('campaigns')
      .insert(input)
      .select('*')
      .single()
    if (error) throw error
    return data as Campaign
  },

  async listRecords(filters?: {
    status?: RecordStatus | 'todos'
    campaignId?: string | 'todos'
    date?: string | 'todos'
    query?: string
  }): Promise<PatientRecord[]> {
    if (isDemoMode) return demoApi.listRecords(filters)
    let query = requireSupabase()
      .from('records')
      .select(RECORD_SELECT)
      .order('created_at', { ascending: false })

    if (filters?.status && filters.status !== 'todos') {
      query = query.eq('status', filters.status)
    }
    if (filters?.campaignId && filters.campaignId !== 'todos') {
      query = query.eq('campaign_id', filters.campaignId)
    }

    const { data, error } = await query
    if (error) throw error

    let rows = ((data ?? []) as PatientRecord[]).map(mapRecord)

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
          r.ficha_nro.toLowerCase().includes(q),
      )
    }
    return rows
  },

  async createRecord(
    input: PatientRecordInput,
    createdBy: string | null,
  ): Promise<PatientRecord> {
    if (isDemoMode) return demoApi.createRecord(input, createdBy)
    const client = requireSupabase()
    const { data: fichaNro, error: fichaError } = await client.rpc(
      'next_ficha_nro',
      { p_campaign_id: input.campaign_id },
    )
    if (fichaError) throw fichaError

    const { data, error } = await client
      .from('records')
      .insert({
        ...input,
        ficha_nro: fichaNro as string,
        status: 'precargada',
        created_by: createdBy,
      })
      .select(RECORD_SELECT)
      .single()
    if (error) throw error
    return mapRecord(data as PatientRecord)
  },

  async updateRecord(
    recordId: string,
    patch: Partial<PatientRecordInput> & { status?: RecordStatus },
  ): Promise<PatientRecord> {
    if (isDemoMode) return demoApi.updateRecord(recordId, patch)
    const { data, error } = await requireSupabase()
      .from('records')
      .update(patch)
      .eq('id', recordId)
      .select(RECORD_SELECT)
      .single()
    if (error) throw error
    return mapRecord(data as PatientRecord)
  },

  async deleteRecord(recordId: string): Promise<void> {
    if (isDemoMode) return demoApi.deleteRecord(recordId)
    const { error } = await requireSupabase()
      .from('records')
      .delete()
      .eq('id', recordId)
    if (error) throw error
  },

  async saveRefraction(
    recordId: string,
    input: RefractionInput,
  ): Promise<Refraction> {
    if (isDemoMode) return demoApi.saveRefraction(recordId, input)
    const client = requireSupabase()
    const { data, error } = await client
      .from('refractions')
      .upsert({ record_id: recordId, ...input }, { onConflict: 'record_id' })
      .select('*')
      .single()
    if (error) throw error

    await client
      .from('records')
      .update({ status: 'graduada' })
      .eq('id', recordId)
      .eq('status', 'precargada')

    return data as Refraction
  },

  async saveOrder(recordId: string, input: OrderInput): Promise<Order> {
    if (isDemoMode) return demoApi.saveOrder(recordId, input)
    const client = requireSupabase()
    const payload = {
      record_id: recordId,
      lens: input.lens,
      frame: input.frame,
      treatment: input.treatment,
      color: input.color,
      shape: input.shape,
      distance: input.distance,
      total: input.total,
      deposit: input.deposit,
    }
    const { data, error } = await client
      .from('orders')
      .upsert(payload, { onConflict: 'record_id' })
      .select('*')
      .single()
    if (error) throw error

    const nextStatus = input.status ?? 'pendiente'
    await client.from('records').update({ status: nextStatus }).eq('id', recordId)

    return data as Order
  },

  async addFile(
    recordId: string,
    file: File,
  ): Promise<RecordFile> {
    if (isDemoMode) {
      const dataUrl = await readFileAsDataUrl(file)
      return demoApi.addFile(recordId, file.name, dataUrl)
    }
    const client = requireSupabase()
    const path = `${recordId}/${Date.now()}-${file.name}`
    const { error: uploadError } = await client.storage
      .from('archivos')
      .upload(path, file)
    if (uploadError) throw uploadError

    const { data, error } = await client
      .from('files')
      .insert({ record_id: recordId, path, name: file.name })
      .select('*')
      .single()
    if (error) throw error
    return data as RecordFile
  },

  async deleteFile(fileId: string, path?: string): Promise<void> {
    if (isDemoMode) return demoApi.deleteFile(fileId)
    const client = requireSupabase()
    if (path && !path.startsWith('data:') && !path.startsWith('http')) {
      await client.storage.from('archivos').remove([path])
    }
    const { error } = await client.from('files').delete().eq('id', fileId)
    if (error) throw error
  },

  getFileUrl(path: string): string {
    if (path.startsWith('data:') || path.startsWith('http')) return path
    if (isDemoMode) return path
    const { data } = requireSupabase().storage.from('archivos').getPublicUrl(path)
    return data.publicUrl
  },

  async listProfiles(): Promise<Profile[]> {
    if (isDemoMode) return demoApi.listProfiles()
    const { data, error } = await requireSupabase()
      .from('profiles')
      .select('id, email, full_name, role')
      .order('email')
    if (error) throw error
    return (data ?? []) as Profile[]
  },

  async updateProfileRole(userId: string, role: UserRole): Promise<void> {
    if (isDemoMode) return demoApi.updateProfileRole(userId, role)
    const { error } = await requireSupabase()
      .from('profiles')
      .update({ role })
      .eq('id', userId)
    if (error) throw error
  },

  async getStats(): Promise<Record<RecordStatus | 'total', number>> {
    if (isDemoMode) return demoApi.getStats()
    const rows = await dataApi.listRecords()
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

  resetDemo(): void {
    if (!isDemoMode) return
    demoApi.reset()
  },
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

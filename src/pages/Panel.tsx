import { useEffect, useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { dataApi } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { isDemoMode } from '../lib/supabase'
import {
  buildSmsUrl,
  buildWhatsAppUrl,
  exportRecordPdf,
  exportRecordsExcel,
  exportRecordsPdf,
  exportStickersPdf,
} from '../lib/exports'
import { ROLE_LABELS, STATUS_LABELS } from '../lib/status'
import type {
  Campaign,
  PatientRecord,
  Profile,
  RecordStatus,
  UserRole,
} from '../types'
import { StatusBadge } from '../components/StatusBadge'
import {
  Alert,
  Button,
  Card,
  EmptyState,
  Field,
  Label,
  PageHeader,
  Select,
  StatCard,
} from '../components/ui'

export function PanelPage() {
  const { profile } = useAuth()
  const [records, setRecords] = useState<PatientRecord[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [stats, setStats] = useState<Record<string, number> | null>(null)
  const [status, setStatus] = useState<RecordStatus | 'todos'>('todos')
  const [campaignId, setCampaignId] = useState<string | 'todos'>('todos')
  const [date, setDate] = useState<string | 'todos'>('todos')
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [editing, setEditing] = useState<PatientRecord | null>(null)
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    location: '',
    date: new Date().toISOString().slice(0, 10),
  })

  const load = async () => {
    const [rows, camps, st] = await Promise.all([
      dataApi.listRecords({ status, campaignId, date, query }),
      dataApi.listCampaigns(),
      dataApi.getStats(),
    ])
    setRecords(rows)
    setCampaigns(camps)
    setStats(st)
    if (profile?.role === 'admin') {
      setProfiles(await dataApi.listProfiles())
    }
  }

  useEffect(() => {
    void load().catch((err) =>
      setError(err instanceof Error ? err.message : 'Error al cargar'),
    )
  }, [status, campaignId, date])

  const dates = useMemo(() => {
    const set = new Set(
      records.map((r) => (r.appointment_at ?? r.created_at).slice(0, 10)),
    )
    return [...set].sort().reverse()
  }, [records])

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = !q
      ? records
      : records.filter(
          (r) =>
            r.full_name.toLowerCase().includes(q) ||
            r.ficha_nro.toLowerCase().includes(q) ||
            r.phone.includes(q),
        )

    const map = new Map<string, PatientRecord[]>()
    for (const r of filtered) {
      const key = `${r.campaigns?.name ?? 'Sin campaña'}|${(r.appointment_at ?? r.created_at).slice(0, 10)}`
      const list = map.get(key) ?? []
      list.push(r)
      map.set(key, list)
    }
    return [...map.entries()]
  }, [records, query])

  const onDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta ficha?')) return
    try {
      await dataApi.deleteRecord(id)
      setMessage('Ficha eliminada')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar')
    }
  }

  const onSaveEdit = async () => {
    if (!editing) return
    try {
      await dataApi.updateRecord(editing.id, {
        full_name: editing.full_name,
        phone: editing.phone,
        city: editing.city,
        street: editing.street,
        insurance: editing.insurance,
        recipe_nro: editing.recipe_nro,
        age: editing.age,
        status: editing.status,
      })
      setEditing(null)
      setMessage('Ficha actualizada')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo editar')
    }
  }

  const onRoleChange = async (userId: string, role: UserRole) => {
    try {
      await dataApi.updateProfileRole(userId, role)
      setProfiles(await dataApi.listProfiles())
      setMessage('Rol actualizado')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar el rol')
    }
  }

  const onCreateCampaign = async () => {
    if (!newCampaign.name.trim()) return
    try {
      await dataApi.createCampaign(newCampaign)
      setNewCampaign({
        name: '',
        location: '',
        date: new Date().toISOString().slice(0, 10),
      })
      setMessage('Campaña creada')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear')
    }
  }

  const onResetDemo = () => {
    if (!isDemoMode) return
    if (!confirm('¿Restablecer datos demo? Se pierden cambios locales.')) return
    dataApi.resetDemo()
    window.location.reload()
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 page-enter">
      <PageHeader
        eyebrow="Puesto 04"
        title="Panel de gestión"
        description="Vista completa: filtros, exportaciones, roles y campañas."
        actions={
          isDemoMode ? (
            <Button type="button" variant="ghost" onClick={onResetDemo}>
              <RefreshCw className="h-4 w-4" />
              Reset demo
            </Button>
          ) : undefined
        }
      />

      {stats && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total fichas" value={stats.total} accent />
          <StatCard label="Precargadas" value={stats.precargada} />
          <StatCard label="En óptico" value={stats.graduada + stats.pendiente + stats.confirmada} />
          <StatCard label="Entregadas" value={stats.entregada} />
        </div>
      )}

      <Card className="flex flex-wrap gap-2 p-4">
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value as RecordStatus | 'todos')}
        >
          <option value="todos">Todos los estados</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          value={campaignId}
          onChange={(e) => setCampaignId(e.target.value)}
        >
          <option value="todos">Todas las campañas</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select value={date} onChange={(e) => setDate(e.target.value)}>
          <option value="todos">Todas las fechas</option>
          {dates.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </Select>
        <Field
          className="min-w-[200px] flex-1"
          placeholder="Buscar nombre, ficha o teléfono"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button type="button" variant="ghost" onClick={() => exportRecordsPdf(records)}>
          PDF
        </Button>
        <Button type="button" variant="ghost" onClick={() => exportRecordsExcel(records)}>
          Excel
        </Button>
        <Button type="button" variant="ghost" onClick={() => exportStickersPdf(records)}>
          Stickers
        </Button>
      </Card>

      {message && <Alert tone="ok">{message}</Alert>}
      {error && <Alert tone="error">{error}</Alert>}

      <div className="space-y-6">
        {grouped.map(([key, list]) => {
          const [campaignName, day] = key.split('|')
          return (
            <section key={key} className="space-y-3">
              <div>
                <h2 className="font-display text-xl font-bold">
                  {campaignName}
                </h2>
                <p className="text-sm text-slate-500">Fecha {day}</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {list.map((r) => (
                  <Card key={r.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Ficha {r.ficha_nro}
                        </p>
                        <p className="font-semibold">{r.full_name}</p>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      {r.phone || 'Sin teléfono'} · {r.city || 'Sin localidad'}
                    </p>
                    {r.orders && (
                      <p className="mt-1 text-sm text-slate-600">
                        Total ${r.orders.total.toLocaleString('es-AR')} · Seña $
                        {r.orders.deposit.toLocaleString('es-AR')} · Saldo $
                        {r.orders.balance.toLocaleString('es-AR')}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a className="btn btn-ghost !px-2 !py-1 text-xs" href={buildWhatsAppUrl(r)} target="_blank" rel="noreferrer">
                        WhatsApp
                      </a>
                      <a className="btn btn-ghost !px-2 !py-1 text-xs" href={buildSmsUrl(r)}>
                        SMS
                      </a>
                      <button
                        type="button"
                        className="btn btn-ghost !px-2 !py-1 text-xs"
                        onClick={() => exportRecordPdf(r)}
                      >
                        PDF
                      </button>
                      {profile?.role === 'admin' && (
                        <>
                          <button
                            type="button"
                            className="btn btn-ghost !px-2 !py-1 text-xs"
                            onClick={() => setEditing(r)}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger !px-2 !py-1 text-xs"
                            onClick={() => void onDelete(r.id)}
                          >
                            Eliminar
                          </button>
                        </>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )
        })}
        {grouped.length === 0 && (
          <EmptyState
            title="Sin resultados"
            description="Probá otros filtros o cargá pacientes desde recepción."
          />
        )}
      </div>

      {profile?.role === 'admin' && (
        <>
          <Card className="p-5">
            <h2 className="font-display text-lg font-bold">Nueva campaña</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-4">
              <Field
                placeholder="Nombre"
                value={newCampaign.name}
                onChange={(e) =>
                  setNewCampaign((p) => ({ ...p, name: e.target.value }))
                }
              />
              <Field
                placeholder="Localidad"
                value={newCampaign.location}
                onChange={(e) =>
                  setNewCampaign((p) => ({ ...p, location: e.target.value }))
                }
              />
              <Field
                type="date"
                value={newCampaign.date}
                onChange={(e) =>
                  setNewCampaign((p) => ({ ...p, date: e.target.value }))
                }
              />
              <Button type="button" variant="ink" onClick={() => void onCreateCampaign()}>
                Crear
              </Button>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {campaigns.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm"
                >
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-slate-500">
                    {c.location || 'Sin localidad'} · {c.date}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-display text-lg font-bold">Roles de usuarios</h2>
            <div className="mt-3 space-y-2">
              {profiles.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--line)] px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-semibold">{p.full_name}</p>
                    <p className="text-xs text-slate-500">{p.email}</p>
                  </div>
                  <Select
                    className="w-auto min-w-[160px]"
                    value={p.role}
                    onChange={(e) =>
                      void onRoleChange(p.id, e.target.value as UserRole)
                    }
                  >
                    {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </Select>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(11,18,32,0.55)] p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-5">
            <h3 className="font-display text-lg font-bold">
              Editar ficha {editing.ficha_nro}
            </h3>
            <div className="mt-4 grid gap-3">
              <div>
                <Label>Nombre</Label>
                <Field
                  value={editing.full_name}
                  onChange={(e) =>
                    setEditing({ ...editing, full_name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Field
                  value={editing.phone}
                  onChange={(e) =>
                    setEditing({ ...editing, phone: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Calle</Label>
                <Field
                  value={editing.street}
                  onChange={(e) =>
                    setEditing({ ...editing, street: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Localidad</Label>
                <Field
                  value={editing.city}
                  onChange={(e) =>
                    setEditing({ ...editing, city: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Obra social</Label>
                <Field
                  value={editing.insurance}
                  onChange={(e) =>
                    setEditing({ ...editing, insurance: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Estado</Label>
                <Select
                  value={editing.status}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      status: e.target.value as RecordStatus,
                    })
                  }
                >
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                Cancelar
              </Button>
              <Button type="button" onClick={() => void onSaveEdit()}>
                Guardar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

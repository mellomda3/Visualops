import { useEffect, useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { dataApi } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { Campaign, PatientRecord } from '../types'
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
} from '../components/ui'

const emptyForm = {
  campaign_id: '',
  full_name: '',
  phone: '',
  age: '',
  street: '',
  city: '',
  insurance: '',
  recipe_nro: '',
  date: new Date().toISOString().slice(0, 10),
  time: '',
}

export function RecepcionPage() {
  const { profile } = useAuth()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [recent, setRecent] = useState<PatientRecord[]>([])
  const [form, setForm] = useState(emptyForm)
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    location: '',
    date: new Date().toISOString().slice(0, 10),
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showCampaignForm, setShowCampaignForm] = useState(false)

  const load = async () => {
    const [c, r] = await Promise.all([
      dataApi.listCampaigns(),
      dataApi.listRecords({ status: 'precargada' }),
    ])
    setCampaigns(c)
    setRecent(r.slice(0, 12))
    setForm((prev) => ({
      ...prev,
      campaign_id: prev.campaign_id || c[0]?.id || '',
    }))
  }

  useEffect(() => {
    void load().catch((err) =>
      setError(err instanceof Error ? err.message : 'Error al cargar'),
    )
  }, [])

  const onCreateCampaign = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const created = await dataApi.createCampaign(newCampaign)
      setCampaigns((prev) => [created, ...prev])
      setForm((prev) => ({ ...prev, campaign_id: created.id }))
      setNewCampaign({
        name: '',
        location: '',
        date: new Date().toISOString().slice(0, 10),
      })
      setShowCampaignForm(false)
      setMessage(`Campaña "${created.name}" creada`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la campaña')
    } finally {
      setBusy(false)
    }
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      if (!form.campaign_id) throw new Error('Seleccioná una campaña')
      if (!form.full_name.trim()) throw new Error('El nombre es obligatorio')
      const appointment_at = form.time
        ? new Date(`${form.date}T${form.time}`).toISOString()
        : `${form.date}T12:00:00.000Z`

      const record = await dataApi.createRecord(
        {
          campaign_id: form.campaign_id,
          full_name: form.full_name,
          phone: form.phone,
          age: form.age ? Number(form.age) : null,
          street: form.street,
          city: form.city,
          insurance: form.insurance,
          recipe_nro: form.recipe_nro,
          appointment_at,
        },
        profile?.id ?? null,
      )

      setMessage(`Precarga lista · Ficha ${record.ficha_nro} en cola de graduación`)
      setForm((prev) => ({
        ...emptyForm,
        campaign_id: prev.campaign_id,
        date: prev.date,
      }))
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl page-enter">
      <PageHeader
        eyebrow="Puesto 01"
        title="Recepción"
        description="Alta rápida del paciente. Genera ficha correlativa y la deja precargada."
        actions={
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowCampaignForm((v) => !v)}
          >
            <Plus className="h-4 w-4" />
            {showCampaignForm ? 'Ocultar' : 'Nueva campaña'}
          </Button>
        }
      />

      {showCampaignForm && (
        <Card className="mb-5 p-4">
          <form
            onSubmit={onCreateCampaign}
            className="grid gap-3 md:grid-cols-4"
          >
            <Field
              placeholder="Nombre de campaña"
              value={newCampaign.name}
              onChange={(e) =>
                setNewCampaign((p) => ({ ...p, name: e.target.value }))
              }
              required
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
              required
            />
            <Button type="submit" variant="ink" disabled={busy}>
              Crear campaña
            </Button>
          </form>
        </Card>
      )}

      <Card className="p-5">
        <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label>Campaña</Label>
            <Select
              value={form.campaign_id}
              onChange={(e) =>
                setForm((p) => ({ ...p, campaign_id: e.target.value }))
              }
              required
            >
              <option value="">Seleccionar campaña</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.location} · {c.date}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Nombre y apellido</Label>
            <Field
              value={form.full_name}
              onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label>Teléfono</Label>
            <Field
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="3794..."
            />
          </div>
          <div>
            <Label>Edad</Label>
            <Field
              type="number"
              min={0}
              value={form.age}
              onChange={(e) => setForm((p) => ({ ...p, age: e.target.value }))}
            />
          </div>
          <div>
            <Label>Calle</Label>
            <Field
              value={form.street}
              onChange={(e) => setForm((p) => ({ ...p, street: e.target.value }))}
            />
          </div>
          <div>
            <Label>Localidad</Label>
            <Field
              value={form.city}
              onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
            />
          </div>
          <div>
            <Label>Obra social</Label>
            <Field
              value={form.insurance}
              onChange={(e) =>
                setForm((p) => ({ ...p, insurance: e.target.value }))
              }
            />
          </div>
          <div>
            <Label>N° de receta</Label>
            <Field
              value={form.recipe_nro}
              onChange={(e) =>
                setForm((p) => ({ ...p, recipe_nro: e.target.value }))
              }
            />
          </div>
          <div>
            <Label>Fecha</Label>
            <Field
              type="date"
              value={form.date}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label>Horario</Label>
            <Field
              type="time"
              value={form.time}
              onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
            />
          </div>
          <div className="md:col-span-2 pt-2">
            <Button type="submit" disabled={busy}>
              {busy ? 'Guardando…' : 'Guardar precarga'}
            </Button>
          </div>
        </form>
      </Card>

      <div className="mt-4 space-y-2">
        {message && <Alert tone="ok">{message}</Alert>}
        {error && <Alert tone="error">{error}</Alert>}
      </div>

      <section className="mt-8">
        <h2 className="font-display mb-3 text-xl font-bold">Cola precargada</h2>
        {recent.length === 0 ? (
          <EmptyState
            title="Sin precargas"
            description="Cuando guardes un paciente aparecerá acá listo para graduación."
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {recent.map((r) => (
              <Card key={r.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{r.full_name}</p>
                    <p className="text-sm text-slate-500">
                      Ficha {r.ficha_nro} · {r.campaigns?.name}
                    </p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {r.phone || 'Sin teléfono'} · {r.city || 'Sin localidad'}
                  {r.age != null ? ` · ${r.age} años` : ''}
                </p>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

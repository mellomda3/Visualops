import { useEffect, useState, type FormEvent } from 'react'
import { dataApi } from '../lib/api'
import type { PatientRecord, RefractionInput } from '../types'
import { StatusBadge } from '../components/StatusBadge'
import {
  Alert,
  Button,
  Card,
  EmptyState,
  Field,
  Label,
  PageHeader,
  TextArea,
} from '../components/ui'

const emptyRefraction: RefractionInput = {
  od_sph: null,
  od_cyl: null,
  od_axis: null,
  os_sph: null,
  os_cyl: null,
  os_axis: null,
  add_power: null,
  dnp: null,
  notes: null,
}

function numOrNull(value: string): number | null {
  if (value.trim() === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export function GraduacionPage() {
  const [queue, setQueue] = useState<PatientRecord[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [fields, setFields] = useState<Record<string, string>>({})
  const [form, setForm] = useState(emptyRefraction)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const selected = queue.find((r) => r.id === selectedId) ?? null

  const load = async () => {
    const [precargadas, graduadas] = await Promise.all([
      dataApi.listRecords({ status: 'precargada' }),
      dataApi.listRecords({ status: 'graduada' }),
    ])
    const rows = [...precargadas, ...graduadas].sort((a, b) =>
      a.created_at.localeCompare(b.created_at),
    )
    setQueue(rows)
    if (selectedId && !rows.some((r) => r.id === selectedId)) {
      setSelectedId(null)
      setForm(emptyRefraction)
      setFields({})
    }
  }

  useEffect(() => {
    void load().catch((err) =>
      setError(err instanceof Error ? err.message : 'Error al cargar'),
    )
    const id = window.setInterval(() => {
      void load().catch(() => undefined)
    }, 20000)
    return () => window.clearInterval(id)
  }, [])

  const selectRecord = (record: PatientRecord) => {
    setSelectedId(record.id)
    setMessage('')
    setError('')
    const r = record.refractions
    setForm({
      od_sph: r?.od_sph ?? null,
      od_cyl: r?.od_cyl ?? null,
      od_axis: r?.od_axis ?? null,
      os_sph: r?.os_sph ?? null,
      os_cyl: r?.os_cyl ?? null,
      os_axis: r?.os_axis ?? null,
      add_power: r?.add_power ?? null,
      dnp: r?.dnp ?? null,
      notes: r?.notes ?? null,
    })
    setFields({
      od_sph: r?.od_sph?.toString() ?? '',
      od_cyl: r?.od_cyl?.toString() ?? '',
      od_axis: r?.od_axis?.toString() ?? '',
      os_sph: r?.os_sph?.toString() ?? '',
      os_cyl: r?.os_cyl?.toString() ?? '',
      os_axis: r?.os_axis?.toString() ?? '',
      add_power: r?.add_power?.toString() ?? '',
      dnp: r?.dnp?.toString() ?? '',
      notes: r?.notes ?? '',
    })
  }

  const onChangeField = (key: string, value: string) => {
    setFields((p) => ({ ...p, [key]: value }))
    if (key === 'notes') {
      setForm((p) => ({ ...p, notes: value || null }))
      return
    }
    setForm((p) => ({ ...p, [key]: numOrNull(value) }))
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!selected) return
    const hasValue = [
      form.od_sph,
      form.od_cyl,
      form.od_axis,
      form.os_sph,
      form.os_cyl,
      form.os_axis,
      form.add_power,
      form.dnp,
    ].some((v) => v != null)
    if (!hasValue) {
      setError('Cargá al menos un valor de refracción (ESF, CIL, EJE, ADD o DNP)')
      return
    }
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await dataApi.saveRefraction(selected.id, form)
      setMessage(`Receta guardada · Ficha ${selected.ficha_nro} → graduada`)
      setSelectedId(null)
      setForm(emptyRefraction)
      setFields({})
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setBusy(false)
    }
  }

  const field = (key: string, label: string) => (
    <div>
      <Label>{label}</Label>
      <Field
        value={fields[key] ?? ''}
        onChange={(e) => onChangeField(key, e.target.value)}
        inputMode="decimal"
        placeholder="0.00"
      />
    </div>
  )

  return (
    <div className="mx-auto grid max-w-6xl gap-6 page-enter lg:grid-cols-[320px_1fr]">
      <Card className="p-4">
        <PageHeader
          eyebrow="Puesto 02"
          title="Graduación"
          description="Cola de precargadas y re-edición de graduadas."
        />
        <div className="space-y-2">
          {queue.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => selectRecord(r)}
              className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                selectedId === r.id
                  ? 'border-[var(--signal)] bg-[#e7faf6]'
                  : 'border-[var(--line)] bg-white hover:border-[var(--signal)]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{r.full_name}</p>
                <StatusBadge status={r.status} />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Ficha {r.ficha_nro} · {r.campaigns?.name}
              </p>
            </button>
          ))}
          {queue.length === 0 && (
            <EmptyState
              title="Cola vacía"
              description="No hay fichas precargadas. Recepción tiene que cargar pacientes."
            />
          )}
        </div>
      </Card>

      <Card className="p-5">
        {!selected ? (
          <EmptyState
            title="Elegí un paciente"
            description="Seleccioná alguien de la cola para cargar OD / OI, ADD y DNP."
          />
        ) : (
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <h2 className="font-display text-2xl font-bold">{selected.full_name}</h2>
              <p className="text-sm text-slate-600">
                Ficha {selected.ficha_nro} · {selected.phone || 'Sin teléfono'}
                {selected.age != null ? ` · ${selected.age} años` : ''}
              </p>
              <p className="text-sm text-slate-500">
                {selected.campaigns?.name} · {selected.city || 'Sin localidad'}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <fieldset className="space-y-3 rounded-xl border border-[var(--line)] p-4">
                <legend className="px-1 text-sm font-bold text-[var(--signal-deep)]">
                  Ojo derecho (OD)
                </legend>
                {field('od_sph', 'ESF')}
                {field('od_cyl', 'CIL')}
                {field('od_axis', 'EJE')}
              </fieldset>
              <fieldset className="space-y-3 rounded-xl border border-[var(--line)] p-4">
                <legend className="px-1 text-sm font-bold text-[var(--flare)]">
                  Ojo izquierdo (OI)
                </legend>
                {field('os_sph', 'ESF')}
                {field('os_cyl', 'CIL')}
                {field('os_axis', 'EJE')}
              </fieldset>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {field('add_power', 'ADD')}
              {field('dnp', 'DNP')}
            </div>

            <div>
              <Label>Observaciones</Label>
              <TextArea
                value={fields.notes ?? ''}
                onChange={(e) => onChangeField('notes', e.target.value)}
                rows={3}
              />
            </div>

            <Button type="submit" disabled={busy}>
              {busy ? 'Guardando…' : selected.status === 'graduada' ? 'Actualizar receta' : 'Guardar receta y pasar a graduada'}
            </Button>
          </form>
        )}

        <div className="mt-4 space-y-2">
          {message && <Alert tone="ok">{message}</Alert>}
          {error && <Alert tone="error">{error}</Alert>}
        </div>
      </Card>
    </div>
  )
}

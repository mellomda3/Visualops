import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { FileText, MessageSquare, Trash2 } from 'lucide-react'
import { dataApi } from '../lib/api'
import {
  buildSmsUrl,
  buildWhatsAppUrl,
  exportRecordPdf,
} from '../lib/exports'
import { OPTICO_STATUSES, STATUS_LABELS } from '../lib/status'
import type { FileKind, OrderInput, PatientRecord, RecordStatus } from '../types'
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

const emptyOrder = {
  lens: '',
  frame: '',
  treatment: '',
  color: '',
  shape: '',
  distance: '',
  total: '',
  deposit: '',
  status: 'pendiente' as RecordStatus,
}

export function OpticoPage() {
  const [records, setRecords] = useState<PatientRecord[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<RecordStatus | 'todos'>(
    'todos',
  )
  const [query, setQuery] = useState('')
  const [form, setForm] = useState(emptyOrder)
  const [fileKind, setFileKind] = useState<FileKind>('receta')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const selected = records.find((r) => r.id === selectedId) ?? null

  const load = async () => {
    const rows = await dataApi.listRecords({
      status: statusFilter === 'todos' ? 'todos' : statusFilter,
    })
    const next =
      statusFilter === 'todos'
        ? rows.filter((r) => OPTICO_STATUSES.includes(r.status))
        : rows.filter((r) => r.status === statusFilter)
    setRecords(next)
  }

  useEffect(() => {
    void load().catch((err) =>
      setError(err instanceof Error ? err.message : 'Error al cargar'),
    )
  }, [statusFilter])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return records
    return records.filter(
      (r) =>
        r.full_name.toLowerCase().includes(q) ||
        r.ficha_nro.toLowerCase().includes(q) ||
        r.phone.includes(q),
    )
  }, [records, query])

  const selectRecord = (record: PatientRecord) => {
    setSelectedId(record.id)
    setMessage('')
    setError('')
    const o = record.orders
    setForm({
      lens: o?.lens ?? '',
      frame: o?.frame ?? '',
      treatment: o?.treatment ?? '',
      color: o?.color ?? '',
      shape: o?.shape ?? '',
      distance: o?.distance ?? '',
      total: o?.total?.toString() ?? '',
      deposit: o?.deposit?.toString() ?? '',
      status:
        record.status === 'graduada'
          ? 'pendiente'
          : (record.status as RecordStatus),
    })
  }

  const refreshSelected = async (id: string, ficha: string) => {
    await load()
    const refreshed = await dataApi.listRecords({ query: ficha })
    const next = refreshed.find((r) => r.id === id)
    if (next) selectRecord(next)
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!selected) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const total = Number(form.total || 0)
      const deposit = Number(form.deposit || 0)
      if (deposit > total) throw new Error('La seña no puede superar el total')

      const input: OrderInput = {
        lens: form.lens || null,
        frame: form.frame || null,
        treatment: form.treatment || null,
        color: form.color || null,
        shape: form.shape || null,
        distance: form.distance || null,
        total,
        deposit,
        status: form.status,
      }
      await dataApi.saveOrder(selected.id, input)
      setMessage(`Pedido guardado · Ficha ${selected.ficha_nro}`)
      await refreshSelected(selected.id, selected.ficha_nro)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setBusy(false)
    }
  }

  const quickStatus = async (status: RecordStatus) => {
    if (!selected) return
    setForm((p) => ({ ...p, status }))
    setBusy(true)
    try {
      const total = Number(form.total || selected.orders?.total || 0)
      const deposit = Number(form.deposit || selected.orders?.deposit || 0)
      await dataApi.saveOrder(selected.id, {
        lens: form.lens || selected.orders?.lens || null,
        frame: form.frame || selected.orders?.frame || null,
        treatment: form.treatment || selected.orders?.treatment || null,
        color: form.color || selected.orders?.color || null,
        shape: form.shape || selected.orders?.shape || null,
        distance: form.distance || selected.orders?.distance || null,
        total,
        deposit,
        status,
      })
      setMessage(`Estado → ${STATUS_LABELS[status]}`)
      await refreshSelected(selected.id, selected.ficha_nro)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar')
    } finally {
      setBusy(false)
    }
  }

  const onUpload = async (file: File | null) => {
    if (!selected || !file) return
    setBusy(true)
    try {
      await dataApi.addFile(selected.id, file, fileKind)
      setMessage(`Archivo "${file.name}" adjunto`)
      await refreshSelected(selected.id, selected.ficha_nro)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir')
    } finally {
      setBusy(false)
    }
  }

  const onDeleteFile = async (fileId: string, path: string) => {
    if (!selected || !confirm('¿Eliminar archivo?')) return
    setBusy(true)
    try {
      await dataApi.deleteFile(fileId, path)
      setMessage('Archivo eliminado')
      await refreshSelected(selected.id, selected.ficha_nro)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar')
    } finally {
      setBusy(false)
    }
  }

  const balance = Number(form.total || 0) - Number(form.deposit || 0)

  return (
    <div className="mx-auto grid max-w-6xl gap-6 page-enter lg:grid-cols-[340px_1fr]">
      <Card className="p-4">
        <PageHeader
          eyebrow="Puesto 03"
          title="Óptico"
          description="Pedido, cobro, archivo y entrega."
        />
        <div className="space-y-2">
          <Field
            placeholder="Buscar nombre, ficha o teléfono"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as RecordStatus | 'todos')
            }
          >
            <option value="todos">Estados de óptico</option>
            {OPTICO_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </div>

        <div className="mt-4 max-h-[58vh] space-y-2 overflow-auto pr-1">
          {filtered.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => selectRecord(r)}
              className={`w-full rounded-xl border px-3 py-3 text-left ${
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
              {r.orders && (
                <p className="mt-1 text-xs text-slate-600">
                  Saldo ${r.orders.balance.toLocaleString('es-AR')}
                </p>
              )}
            </button>
          ))}
          {filtered.length === 0 && (
            <EmptyState
              title="Sin fichas"
              description="No hay pacientes en este filtro. Graduación debe pasar fichas a graduada."
            />
          )}
        </div>
      </Card>

      <Card className="p-5">
        {!selected ? (
          <EmptyState
            title="Seleccioná una ficha"
            description="Completá cristal, armazón, montos y avanzá el estado."
          />
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-bold">
                  {selected.full_name}
                </h2>
                <p className="text-sm text-slate-600">
                  Ficha {selected.ficha_nro} · {selected.phone || 'Sin teléfono'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a className="btn btn-ghost text-sm" href={buildWhatsAppUrl(selected)} target="_blank" rel="noreferrer">
                  WhatsApp
                </a>
                <a className="btn btn-ghost text-sm" href={buildSmsUrl(selected)}>
                  <MessageSquare className="h-4 w-4" />
                  SMS
                </a>
                <button
                  type="button"
                  className="btn btn-ghost text-sm"
                  onClick={() => exportRecordPdf(selected)}
                >
                  <FileText className="h-4 w-4" />
                  PDF
                </button>
              </div>
            </div>

            {selected.refractions && (
              <div className="rounded-xl bg-[var(--mist)] p-3 text-sm text-slate-700">
                <p className="font-bold text-[var(--ink)]">Receta cargada</p>
                <p className="mt-1">
                  OD {selected.refractions.od_sph}/{selected.refractions.od_cyl} x
                  {selected.refractions.od_axis} · OI{' '}
                  {selected.refractions.os_sph}/{selected.refractions.os_cyl} x
                  {selected.refractions.os_axis}
                </p>
                <p>
                  ADD {selected.refractions.add_power ?? '—'} · DNP{' '}
                  {selected.refractions.dnp ?? '—'}
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="ghost" disabled={busy} onClick={() => void quickStatus('pendiente')}>
                Pendiente
              </Button>
              <Button type="button" variant="ghost" disabled={busy} onClick={() => void quickStatus('confirmada')}>
                Confirmar
              </Button>
              <Button type="button" variant="primary" disabled={busy} onClick={() => void quickStatus('entregada')}>
                Entregar
              </Button>
              <Button type="button" variant="danger" disabled={busy} onClick={() => void quickStatus('cancelada')}>
                Cancelar
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {(
                [
                  ['lens', 'Cristal'],
                  ['frame', 'Armazón'],
                  ['treatment', 'Tratamiento'],
                  ['color', 'Color'],
                  ['shape', 'Forma'],
                  ['distance', 'Distancia'],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <Label>{label}</Label>
                  <Field
                    value={form[key]}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, [key]: e.target.value }))
                    }
                  />
                </div>
              ))}
              <div>
                <Label>Total</Label>
                <Field
                  type="number"
                  min={0}
                  value={form.total}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, total: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Seña</Label>
                <Field
                  type="number"
                  min={0}
                  value={form.deposit}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, deposit: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Estado</Label>
                <Select
                  value={form.status}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      status: e.target.value as RecordStatus,
                    }))
                  }
                >
                  {OPTICO_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                  <option value="cancelada">Cancelada</option>
                </Select>
              </div>
              <div className="flex items-end">
                <div className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm">
                  Saldo:{' '}
                  <strong>${balance.toLocaleString('es-AR')}</strong>
                </div>
              </div>
            </div>

            <div>
              <Label>Adjuntar archivo (receta, historia, DNI)</Label>
              <Select
                value={fileKind}
                onChange={(e) => setFileKind(e.target.value as FileKind)}
              >
                <option value="receta">Receta</option>
                <option value="historia">Historia clínica</option>
                <option value="dni">DNI</option>
                <option value="armazon">Armazón</option>
                <option value="otro">Otro</option>
              </Select>
              <Field
                className="mt-2"
                type="file"
                onChange={(e) => void onUpload(e.target.files?.[0] ?? null)}
              />
            </div>

            {selected.files && selected.files.length > 0 && (
              <ul className="space-y-2">
                {selected.files.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
                  >
                    <a
                      className="text-[var(--signal-deep)] underline"
                      href={dataApi.getFileUrl(f.path)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {f.name}
                    </a>
                    <button
                      type="button"
                      className="text-rose-600"
                      onClick={() => void onDeleteFile(f.id, f.path)}
                      aria-label="Eliminar archivo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <Button type="submit" disabled={busy}>
              {busy ? 'Guardando…' : 'Guardar pedido'}
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

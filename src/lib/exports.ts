import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import type { PatientRecord } from '../types'
import { STATUS_LABELS } from './status'

function money(n: number | null | undefined): string {
  return `$${Number(n ?? 0).toLocaleString('es-AR')}`
}

/** Normaliza teléfono AR para wa.me (54 + área sin 0 + número sin 15). */
export function normalizeArPhone(raw: string): string {
  let digits = raw.replace(/\D/g, '')
  if (digits.startsWith('54')) digits = digits.slice(2)
  if (digits.startsWith('0')) digits = digits.slice(1)
  if (digits.length >= 12 && digits.slice(2, 4) === '15') {
    digits = digits.slice(0, 2) + digits.slice(4)
  } else if (digits.length >= 10 && digits.slice(0, 2) !== '15' && digits.includes('15')) {
    // common local formats already handled above
  }
  if (digits.startsWith('15') && digits.length >= 10) {
    digits = digits.slice(2)
  }
  return `54${digits}`
}

export function hasUsablePhone(raw: string | null | undefined): boolean {
  return (raw ?? '').replace(/\D/g, '').length >= 8
}

export function buildWhatsAppUrl(record: PatientRecord): string | null {
  if (!hasUsablePhone(record.phone)) return null
  const withCountry = normalizeArPhone(record.phone)
  const order = record.orders
  const text = [
    `Hola ${record.full_name},`,
    '',
    `Tu ficha visual N° ${record.ficha_nro} fue registrada correctamente.`,
    record.campaigns?.name ? `Campaña: ${record.campaigns.name}` : '',
    order
      ? `Seña abonada: ${money(order.deposit)}\nTotal: ${money(order.total)}\nSaldo pendiente: ${money(order.balance)}`
      : '',
    '',
    '¡Gracias! — Visualops',
  ]
    .filter(Boolean)
    .join('\n')

  return `https://wa.me/${withCountry}?text=${encodeURIComponent(text)}`
}

export function buildSmsUrl(record: PatientRecord): string | null {
  if (!hasUsablePhone(record.phone)) return null
  const phone = record.phone.replace(/\D/g, '')
  const order = record.orders
  const body = [
    `Hola ${record.full_name},`,
    `Ficha N° ${record.ficha_nro}.`,
    order
      ? `Seña ${money(order.deposit)} / Total ${money(order.total)} / Saldo ${money(order.balance)}`
      : '',
  ]
    .filter(Boolean)
    .join(' ')
  return `sms:${phone}?body=${encodeURIComponent(body)}`
}

export function exportRecordPdf(record: PatientRecord): void {
  const doc = new jsPDF()
  const campaign = record.campaigns?.name ?? '—'
  doc.setFontSize(16)
  doc.text('Visualops — Ficha', 14, 18)
  doc.setFontSize(11)
  doc.text(`Ficha: ${record.ficha_nro}`, 14, 28)
  doc.text(`Paciente: ${record.full_name}`, 14, 36)
  doc.text(`Estado: ${STATUS_LABELS[record.status]}`, 14, 44)
  doc.text(`Campaña: ${campaign}`, 14, 52)
  doc.text(`Teléfono: ${record.phone}`, 14, 60)
  doc.text(`Localidad: ${record.city}`, 14, 68)
  doc.text(`Obra social: ${record.insurance}`, 14, 76)
  doc.text(`Edad: ${record.age ?? '—'}`, 14, 84)

  const refraction = record.refractions
  if (refraction) {
    autoTable(doc, {
      startY: 92,
      head: [['Ojo', 'ESF', 'CIL', 'EJE']],
      body: [
        [
          'OD',
          String(refraction.od_sph ?? ''),
          String(refraction.od_cyl ?? ''),
          String(refraction.od_axis ?? ''),
        ],
        [
          'OI',
          String(refraction.os_sph ?? ''),
          String(refraction.os_cyl ?? ''),
          String(refraction.os_axis ?? ''),
        ],
      ],
    })
    const y = doc.lastAutoTable?.finalY ?? 118
    doc.text(`ADD: ${refraction.add_power ?? '—'}  DNP: ${refraction.dnp ?? '—'}`, 14, y + 10)
    if (refraction.notes) doc.text(`Notas: ${refraction.notes}`, 14, y + 18)
  }

  const order = record.orders
  if (order) {
    const y = refraction ? 148 : 98
    doc.text(`Cristal: ${order.lens ?? '—'}`, 14, y)
    doc.text(`Armazón: ${order.frame ?? '—'}`, 14, y + 8)
    doc.text(`Tratamiento: ${order.treatment ?? '—'}`, 14, y + 16)
    doc.text(
      `Total ${money(order.total)} | Seña ${money(order.deposit)} | Saldo ${money(order.balance)}`,
      14,
      y + 24,
    )
  }

  doc.save(`ficha-${record.ficha_nro}.pdf`)
}

export function exportRecordsExcel(records: PatientRecord[]): void {
  const rows = records.map((r) => ({
    Ficha: r.ficha_nro,
    Nombre: r.full_name,
    Estado: STATUS_LABELS[r.status],
    Campaña: r.campaigns?.name ?? '',
    Teléfono: r.phone,
    Edad: r.age ?? '',
    Calle: r.street,
    Localidad: r.city,
    'Obra social': r.insurance,
    Receta: r.recipe_nro,
    'OD ESF': r.refractions?.od_sph ?? '',
    'OD CIL': r.refractions?.od_cyl ?? '',
    'OD EJE': r.refractions?.od_axis ?? '',
    'OI ESF': r.refractions?.os_sph ?? '',
    'OI CIL': r.refractions?.os_cyl ?? '',
    'OI EJE': r.refractions?.os_axis ?? '',
    ADD: r.refractions?.add_power ?? '',
    DNP: r.refractions?.dnp ?? '',
    Total: r.orders?.total ?? 0,
    Seña: r.orders?.deposit ?? 0,
    Saldo: r.orders?.balance ?? 0,
    Cristal: r.orders?.lens ?? '',
    Armazón: r.orders?.frame ?? '',
  }))
  const sheet = XLSX.utils.json_to_sheet(rows)
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, sheet, 'Fichas')
  XLSX.writeFile(book, 'visualops-fichas.xlsx')
}

export function exportStickersPdf(records: PatientRecord[]): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const cols = 2
  const rows = 5
  const width = 90
  const height = 50
  const marginX = 15
  const marginY = 15

  records.forEach((record, index) => {
    if (index > 0 && index % (cols * rows) === 0) doc.addPage()
    const slot = index % (cols * rows)
    const col = slot % cols
    const row = Math.floor(slot / cols)
    const x = marginX + col * (width + 10)
    const y = marginY + row * (height + 6)

    doc.setDrawColor(80)
    doc.rect(x, y, width, height)
    doc.setFontSize(12)
    doc.text(record.full_name.slice(0, 28), x + 4, y + 10)
    doc.setFontSize(10)
    doc.text(`Ficha ${record.ficha_nro}`, x + 4, y + 18)
    doc.text(record.campaigns?.name?.slice(0, 30) ?? '', x + 4, y + 26)
    doc.text(record.phone, x + 4, y + 34)
    doc.text(STATUS_LABELS[record.status], x + 4, y + 42)
  })

  doc.save('visualops-stickers.pdf')
}

export function exportRecordsPdf(records: PatientRecord[]): void {
  const doc = new jsPDF({ orientation: 'landscape' })
  doc.setFontSize(14)
  doc.text('Visualops — Listado de fichas', 14, 14)
  autoTable(doc, {
    startY: 20,
    head: [['Ficha', 'Nombre', 'Estado', 'Campaña', 'Teléfono', 'Total', 'Saldo']],
    body: records.map((r) => [
      r.ficha_nro,
      r.full_name,
      STATUS_LABELS[r.status],
      r.campaigns?.name ?? '',
      r.phone,
      money(r.orders?.total),
      money(r.orders?.balance),
    ]),
  })
  doc.save('visualops-listado.pdf')
}

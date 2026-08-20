const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

function json(statusCode, body) {
  return { statusCode, headers: cors, body: JSON.stringify(body) }
}

const ROLES = new Set(['recepcion', 'graduador', 'optico', 'admin'])

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors }
  }
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method Not Allowed' })
  }

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const anon = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !anon || !service) {
    return json(500, {
      error:
        'Falta configurar SUPABASE_URL, SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY en Netlify',
    })
  }

  const auth = event.headers.authorization || event.headers.Authorization || ''
  if (!auth.startsWith('Bearer ')) {
    return json(401, { error: 'No autenticado' })
  }
  const userJwt = auth.slice(7)

  try {
    const meRes = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: anon, Authorization: `Bearer ${userJwt}` },
    })
    if (!meRes.ok) return json(401, { error: 'Sesión inválida' })
    const me = await meRes.json()

    const profileRes = await fetch(
      `${url}/rest/v1/profiles?id=eq.${me.id}&select=role`,
      {
        headers: {
          apikey: anon,
          Authorization: `Bearer ${userJwt}`,
        },
      },
    )
    const profiles = await profileRes.json()
    if (!Array.isArray(profiles) || profiles[0]?.role !== 'admin') {
      return json(403, { error: 'Solo administración puede crear usuarios' })
    }

    const body = JSON.parse(event.body || '{}')
    const email = String(body.email || '')
      .trim()
      .toLowerCase()
    const password = String(body.password || '')
    const full_name = String(body.full_name || '').trim()
    const role = String(body.role || 'recepcion')

    if (!email || !password || password.length < 6) {
      return json(400, { error: 'Email y contraseña (mín. 6) son obligatorios' })
    }
    if (!ROLES.has(role)) {
      return json(400, { error: 'Rol inválido' })
    }

    const createRes = await fetch(`${url}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        apikey: service,
        Authorization: `Bearer ${service}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: full_name || email.split('@')[0],
          role,
        },
      }),
    })

    const created = await createRes.json()
    if (!createRes.ok) {
      return json(createRes.status, {
        error: created.msg || created.error_description || created.message || 'No se pudo crear',
      })
    }

    const fullName = full_name || email.split('@')[0]
    await fetch(`${url}/rest/v1/profiles?id=eq.${created.id}`, {
      method: 'PATCH',
      headers: {
        apikey: service,
        Authorization: `Bearer ${service}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        role,
        full_name: fullName,
        email,
      }),
    })

    return json(200, {
      id: created.id,
      email: created.email,
      full_name: fullName,
      role,
    })
  } catch (err) {
    return json(500, {
      error: err instanceof Error ? err.message : 'Error interno',
    })
  }
}

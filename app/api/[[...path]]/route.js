import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'

const MONGO_URL = process.env.MONGO_URL
const DB_NAME = process.env.DB_NAME || 'foodlens'
const ADMIN_KEY = process.env.ADMIN_KEY || 'foodlens2025'

let client
async function getDb() {
  if (!client) {
    client = new MongoClient(MONGO_URL)
    await client.connect()
  }
  return client.db(DB_NAME)
}

function cors(res) {
  res.headers.set('Access-Control-Allow-Origin', '*')
  res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Admin-Key')
  return res
}

export async function OPTIONS() {
  return cors(new NextResponse(null, { status: 204 }))
}

async function route(request, method) {
  const url = new URL(request.url)
  const path = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean)
  const [resource, id] = path

  try {
    const db = await getDb()

    // Health
    if (!resource) return cors(NextResponse.json({ ok: true, service: 'foodlens-api' }))

    // Leads
    if (resource === 'leads') {
      if (method === 'POST') {
        const body = await request.json()
        const { restaurantName, ownerName, instagram, phone, email, dishes } = body || {}
        if (!restaurantName || !ownerName) {
          return cors(NextResponse.json({ error: 'restaurantName and ownerName required' }, { status: 400 }))
        }
        const lead = {
          id: uuidv4(),
          restaurantName,
          ownerName,
          instagram: instagram || '',
          phone: phone || '',
          email: email || '',
          dishes: Array.isArray(dishes) ? dishes : [],
          status: 'new',
          source: 'field-app',
          createdAt: new Date().toISOString(),
        }
        await db.collection('leads').insertOne(lead)
        return cors(NextResponse.json({ ok: true, lead }))
      }

      if (method === 'GET') {
        const adminKey = request.headers.get('x-admin-key') || url.searchParams.get('key')
        if (adminKey !== ADMIN_KEY) {
          return cors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
        }
        const today = url.searchParams.get('today') === '1'
        const filter = {}
        if (today) {
          const start = new Date()
          start.setHours(0, 0, 0, 0)
          filter.createdAt = { $gte: start.toISOString() }
        }
        const leads = await db.collection('leads')
          .find(filter, { projection: { _id: 0 } })
          .sort({ createdAt: -1 })
          .limit(500)
          .toArray()
        return cors(NextResponse.json({ leads }))
      }
    }

    // Admin verify
    if (resource === 'admin' && id === 'verify' && method === 'POST') {
      const body = await request.json()
      if (body?.key === ADMIN_KEY) return cors(NextResponse.json({ ok: true }))
      return cors(NextResponse.json({ ok: false }, { status: 401 }))
    }

    return cors(NextResponse.json({ error: 'not found' }, { status: 404 }))
  } catch (e) {
    console.error(e)
    return cors(NextResponse.json({ error: e.message }, { status: 500 }))
  }
}

export async function GET(request) { return route(request, 'GET') }
export async function POST(request) { return route(request, 'POST') }
export async function PUT(request) { return route(request, 'PUT') }
export async function DELETE(request) { return route(request, 'DELETE') }

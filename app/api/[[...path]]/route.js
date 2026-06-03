import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getDb, getBucket } from '@/lib/firebase-admin'
import { sendLeadNotification, sendWelcomeEmail } from '@/lib/email'

// firebase-admin needs the Node.js runtime (not edge)
export const runtime = 'nodejs'

const ADMIN_KEY = (process.env.ADMIN_KEY || 'foodlens2025').trim()
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024 // 20 MB
const SIGNED_URL_TTL_MS = 60 * 60 * 1000 // 1 hour

function cors(res) {
  res.headers.set('Access-Control-Allow-Origin', '*')
  res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Admin-Key')
  return res
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function notConfigured() {
  return cors(
    NextResponse.json(
      { error: 'Firebase is not configured on the server (missing env vars).' },
      { status: 503 },
    ),
  )
}

// Generate a short-lived read URL for a stored object.
async function signedUrlFor(path) {
  const bucket = getBucket()
  if (!bucket || !path) return null
  try {
    const [url] = await bucket.file(path).getSignedUrl({
      action: 'read',
      expires: Date.now() + SIGNED_URL_TTL_MS,
    })
    return url
  } catch (e) {
    console.error('[storage] signed url failed for', path, e)
    return null
  }
}

// Build a durable Firebase download-token URL (does not expire — use for public media).
function downloadUrl(bucketName, path, token) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(path)}?alt=media&token=${token}`
}

export async function OPTIONS() {
  return cors(new NextResponse(null, { status: 204 }))
}

async function route(request, method) {
  const url = new URL(request.url)
  const path = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean)
  const [resource, id, sub] = path

  try {
    // Health check — works even without Firebase configured.
    if (!resource) {
      return cors(NextResponse.json({ ok: true, service: 'foodlens-api' }))
    }

    // Admin verify
    if (resource === 'admin' && id === 'verify' && method === 'POST') {
      const body = await request.json()
      if (String(body?.key || '').trim() === ADMIN_KEY) return cors(NextResponse.json({ ok: true }))
      return cors(NextResponse.json({ ok: false }, { status: 401 }))
    }

    const db = getDb()

    // Leads
    if (resource === 'leads') {
      // Photo upload: POST /api/leads/<id>/photo (multipart/form-data)
      if (id && sub === 'photo' && method === 'POST') {
        if (!db) return notConfigured()
        const bucket = getBucket()
        if (!bucket) {
          return cors(
            NextResponse.json(
              { error: 'Storage not configured (missing FIREBASE_STORAGE_BUCKET).' },
              { status: 503 },
            ),
          )
        }

        const ref = db.collection('leads').doc(id)
        const snap = await ref.get()
        if (!snap.exists) {
          return cors(NextResponse.json({ error: 'lead not found' }, { status: 404 }))
        }

        const formData = await request.formData()
        const file = formData.get('file')
        if (!file || typeof file.arrayBuffer !== 'function') {
          return cors(NextResponse.json({ error: 'file is required' }, { status: 400 }))
        }

        const contentType = file.type || 'application/octet-stream'
        if (!/^image\//.test(contentType) && !/^video\//.test(contentType)) {
          return cors(
            NextResponse.json({ error: 'only image or video files are allowed' }, { status: 400 }),
          )
        }

        const buffer = Buffer.from(await file.arrayBuffer())
        if (buffer.length > MAX_UPLOAD_BYTES) {
          return cors(NextResponse.json({ error: 'file too large (max 20MB)' }, { status: 413 }))
        }

        const safeName = String(file.name || 'upload')
          .replace(/[^\w.\-]+/g, '_')
          .slice(-80)
        const storagePath = `leads/${id}/${uuidv4()}-${safeName}`

        await bucket.file(storagePath).save(buffer, {
          contentType,
          resumable: false,
          metadata: { cacheControl: 'private, max-age=0' },
        })

        const photo = {
          path: storagePath,
          name: safeName,
          contentType,
          size: buffer.length,
          uploadedAt: new Date().toISOString(),
        }

        const { FieldValue } = await import('firebase-admin/firestore')
        await ref.set(
          {
            photos: FieldValue.arrayUnion(photo),
            status: 'photos_uploaded',
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        )

        const signedUrl = await signedUrlFor(storagePath)
        return cors(NextResponse.json({ ok: true, photo: { ...photo, url: signedUrl } }))
      }

      // Create lead: POST /api/leads
      if (!id && method === 'POST') {
        if (!db) return notConfigured()
        const body = await request.json()
        const { restaurantName, ownerName, instagram, phone, email, dishes } = body || {}
        if (!restaurantName || !ownerName) {
          return cors(
            NextResponse.json({ error: 'restaurantName and ownerName required' }, { status: 400 }),
          )
        }

        const cleanEmail = String(email || '').trim().toLowerCase()
        const lead = {
          restaurantName: String(restaurantName).slice(0, 200),
          ownerName: String(ownerName).slice(0, 200),
          instagram: String(instagram || '').slice(0, 120),
          phone: String(phone || '').slice(0, 50),
          email: cleanEmail.slice(0, 320),
          dishes: Array.isArray(dishes)
            ? dishes.slice(0, 20).map((d) => ({
                name: String(d?.name || '').slice(0, 200),
                size: Number(d?.size) || 0,
              }))
            : [],
          photos: [],
          video: null,
          status: 'new',
          source: 'field-app',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        const docRef = await db.collection('leads').add(lead)
        const leadId = docRef.id

        // Fire-and-forget notifications (don't block the response on email).
        sendLeadNotification({
          name: lead.ownerName,
          email: lead.email,
          restaurant: lead.restaurantName,
          phone: lead.phone,
          instagram: lead.instagram,
          source: lead.source,
          leadId,
        }).catch((e) => console.error('[email] notification failed', e))

        if (lead.email && isValidEmail(lead.email)) {
          sendWelcomeEmail({
            to: lead.email,
            name: lead.ownerName,
            restaurant: lead.restaurantName,
          }).catch((e) => console.error('[email] welcome failed', e))
        }

        return cors(NextResponse.json({ ok: true, lead: { id: leadId, ...lead } }))
      }

      // List leads: GET /api/leads (admin)
      if (!id && method === 'GET') {
        if (!db) return notConfigured()
        const adminKey = (request.headers.get('x-admin-key') || url.searchParams.get('key') || '').trim()
        if (adminKey !== ADMIN_KEY) {
          return cors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
        }

        const today = url.searchParams.get('today') === '1'
        let query = db.collection('leads')
        if (today) {
          const start = new Date()
          start.setHours(0, 0, 0, 0)
          query = query.where('createdAt', '>=', start.toISOString())
        }
        const snap = await query.orderBy('createdAt', 'desc').limit(500).get()

        const leads = await Promise.all(
          snap.docs.map(async (d) => {
            const data = d.data()
            const photos = await Promise.all(
              (data.photos || []).map(async (p) => ({
                ...p,
                url: await signedUrlFor(p.path),
              })),
            )
            let video = data.video || null
            if (video?.path) video = { ...video, url: await signedUrlFor(video.path) }
            return { id: d.id, ...data, photos, video }
          }),
        )

        return cors(NextResponse.json({ leads }))
      }

      // Update lead status / note: PUT /api/leads/<id> (admin)
      if (id && !sub && method === 'PUT') {
        if (!db) return notConfigured()
        const adminKey = (request.headers.get('x-admin-key') || '').trim()
        if (adminKey !== ADMIN_KEY) {
          return cors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
        }
        const ref = db.collection('leads').doc(id)
        const snap = await ref.get()
        if (!snap.exists) return cors(NextResponse.json({ error: 'lead not found' }, { status: 404 }))
        const body = await request.json()
        const ALLOWED = ['new', 'contacted', 'photos_uploaded', 'video_generating', 'video_sent', 'won', 'lost']
        const update = { updatedAt: new Date().toISOString() }
        if (body?.status && ALLOWED.includes(body.status)) update.status = body.status
        if (typeof body?.note === 'string') update.note = body.note.slice(0, 2000)
        await ref.set(update, { merge: true })
        return cors(NextResponse.json({ ok: true, ...update }))
      }

      // Generate video: POST /api/leads/<id>/generate-video (admin)
      // GROUNDWORK ONLY. The video tool/pipeline isn't chosen yet, so this
      // endpoint just marks the lead as queued. Replace the marked section
      // with a real call to your video service when ready.
      if (id && sub === 'generate-video' && method === 'POST') {
        if (!db) return notConfigured()
        const adminKey = (request.headers.get('x-admin-key') || '').trim()
        if (adminKey !== ADMIN_KEY) {
          return cors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
        }
        const ref = db.collection('leads').doc(id)
        const snap = await ref.get()
        if (!snap.exists) {
          return cors(NextResponse.json({ error: 'lead not found' }, { status: 404 }))
        }
        await ref.set(
          { status: 'video_generating', updatedAt: new Date().toISOString() },
          { merge: true },
        )
        // === TODO (video automation) ===
        // 1. Read snap.data().photos (their storage paths).
        // 2. Hand them to your video generator (ffmpeg job / external API).
        // 3. Upload the result to Storage, then set:
        //    { video: { path, generatedAt }, status: 'video_sent' }
        // 4. Email the lead the finished video (see lib/email.js for a template).
        return cors(
          NextResponse.json({
            ok: true,
            status: 'video_generating',
            note: 'Queued. Video generation pipeline not implemented yet.',
          }),
        )
      }
    }

    // Settings (media management for the demo dishes)
    if (resource === 'settings' && id === 'media') {
      if (!db) return notConfigured()
      // Upload a clip for a demo dish: POST /api/settings/media/upload (admin)
      if (sub === 'upload' && method === 'POST') {
        const adminKey = (request.headers.get('x-admin-key') || '').trim()
        if (adminKey !== ADMIN_KEY) return cors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
        const bucket = getBucket()
        if (!bucket) return cors(NextResponse.json({ error: 'Storage not configured (missing FIREBASE_STORAGE_BUCKET).' }, { status: 503 }))
        const formData = await request.formData()
        const file = formData.get('file')
        if (!file || typeof file.arrayBuffer !== 'function') return cors(NextResponse.json({ error: 'file is required' }, { status: 400 }))
        const contentType = file.type || 'application/octet-stream'
        if (!/^image\//.test(contentType) && !/^video\//.test(contentType)) {
          return cors(NextResponse.json({ error: 'only image or video files are allowed' }, { status: 400 }))
        }
        const buffer = Buffer.from(await file.arrayBuffer())
        if (buffer.length > MAX_UPLOAD_BYTES) return cors(NextResponse.json({ error: 'file too large (max 20MB)' }, { status: 413 }))
        const safeName = String(file.name || 'clip').replace(/[^\w.\-]+/g, '_').slice(-80)
        const token = uuidv4()
        const storagePath = `media/${uuidv4()}-${safeName}`
        await bucket.file(storagePath).save(buffer, {
          contentType,
          resumable: false,
          metadata: { metadata: { firebaseStorageDownloadTokens: token }, cacheControl: 'public, max-age=31536000' },
        })
        return cors(NextResponse.json({ ok: true, url: downloadUrl(bucket.name, storagePath, token), contentType }))
      }
      if (method === 'GET') {
        const doc = await db.collection('settings').doc('media').get()
        return cors(NextResponse.json({ dishes: doc.exists ? doc.data().dishes || null : null }))
      }
      if (method === 'PUT') {
        const adminKey = (request.headers.get('x-admin-key') || '').trim()
        if (adminKey !== ADMIN_KEY) {
          return cors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
        }
        const body = await request.json()
        const dishes = Array.isArray(body?.dishes)
          ? body.dishes.slice(0, 5).map((d, i) => ({
              id: d.id || `d${i + 1}`,
              name: String(d.name || '').slice(0, 80),
              price: String(d.price || '').slice(0, 20),
              tag: String(d.tag || '').slice(0, 30),
              desc: String(d.desc || '').slice(0, 200),
              video: String(d.video || '').slice(0, 500),
              poster: String(d.poster || '').slice(0, 500),
            }))
          : []
        await db
          .collection('settings')
          .doc('media')
          .set({ key: 'media', dishes, updatedAt: new Date().toISOString() }, { merge: true })
        return cors(NextResponse.json({ ok: true, dishes }))
      }
    }

    return cors(NextResponse.json({ error: 'not found' }, { status: 404 }))
  } catch (e) {
    console.error(e)
    return cors(NextResponse.json({ error: e.message }, { status: 500 }))
  }
}

export async function GET(request) {
  return route(request, 'GET')
}
export async function POST(request) {
  return route(request, 'POST')
}
export async function PUT(request) {
  return route(request, 'PUT')
}
export async function DELETE(request) {
  return route(request, 'DELETE')
}

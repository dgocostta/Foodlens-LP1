import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getDb, getBucket } from '@/lib/firebase-admin'
import {
  sendLeadNotification,
  sendWelcomeEmail,
  sendAffiliateApplicationReceived,
  sendAffiliateApplicationNotification,
  sendAffiliateApproved,
} from '@/lib/email'

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

// Affiliate code: FL-<FIRSTNAME>-<3 unambiguous alphanum>, e.g. FL-MARIA-7G2.
// Uniqueness is enforced by the caller (checks Firestore + retries).
function genAffiliateCode(name) {
  const first = String(name || '').trim().split(/\s+/)[0] || 'PRO'
  const base =
    first
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 10) || 'PRO'
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no ambiguous 0/O/1/I
  let suffix = ''
  for (let i = 0; i < 3; i += 1) suffix += chars[Math.floor(Math.random() * chars.length)]
  return `FL-${base}-${suffix}`
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

    // Direct-to-Storage signed upload URL (bypasses the serverless body-size limit; for large files/videos)
    if (resource === 'uploads' && id === 'sign' && method === 'POST') {
      const bucket = getBucket()
      if (!bucket) return cors(NextResponse.json({ error: 'Storage not configured (missing FIREBASE_STORAGE_BUCKET).' }, { status: 503 }))
      const body = await request.json()
      const scope = body?.scope
      const contentType = String(body?.contentType || 'application/octet-stream')
      if (!/^image\//.test(contentType) && !/^video\//.test(contentType)) {
        return cors(NextResponse.json({ error: 'only image or video files are allowed' }, { status: 400 }))
      }
      const safeName = String(body?.filename || 'upload').replace(/[^\w.\-]+/g, '_').slice(-80)
      let storagePath
      if (scope === 'media') {
        const adminKey = (request.headers.get('x-admin-key') || '').trim()
        if (adminKey !== ADMIN_KEY) return cors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
        storagePath = `media/${uuidv4()}-${safeName}`
      } else if (scope === 'lead') {
        if (!db) return notConfigured()
        const leadId = String(body?.leadId || '')
        if (!leadId) return cors(NextResponse.json({ error: 'leadId required' }, { status: 400 }))
        const snap = await db.collection('leads').doc(leadId).get()
        if (!snap.exists) return cors(NextResponse.json({ error: 'lead not found' }, { status: 404 }))
        storagePath = `leads/${leadId}/${uuidv4()}-${safeName}`
      } else if (scope === 'affiliate') {
        if (!db) return notConfigured()
        if (!/^image\//.test(contentType)) return cors(NextResponse.json({ error: 'avatar must be an image' }, { status: 400 }))
        const affiliateId = String(body?.affiliateId || '')
        if (!affiliateId) return cors(NextResponse.json({ error: 'affiliateId required' }, { status: 400 }))
        const aSnap = await db.collection('affiliates').doc(affiliateId).get()
        if (!aSnap.exists) return cors(NextResponse.json({ error: 'affiliate not found' }, { status: 404 }))
        storagePath = `affiliates/${affiliateId}/${uuidv4()}-${safeName}`
      } else {
        return cors(NextResponse.json({ error: 'invalid scope' }, { status: 400 }))
      }
      const [uploadUrl] = await bucket.file(storagePath).getSignedUrl({
        version: 'v4', action: 'write', expires: Date.now() + 15 * 60 * 1000, contentType,
      })
      return cors(NextResponse.json({ ok: true, uploadUrl, path: storagePath, contentType }))
    }

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

      // Record a direct-uploaded file: POST /api/leads/<id>/photo-record
      if (id && sub === 'photo-record' && method === 'POST') {
        if (!db) return notConfigured()
        const ref = db.collection('leads').doc(id)
        const snap = await ref.get()
        if (!snap.exists) return cors(NextResponse.json({ error: 'lead not found' }, { status: 404 }))
        const body = await request.json()
        const filePath = String(body?.path || '')
        if (!filePath.startsWith(`leads/${id}/`)) return cors(NextResponse.json({ error: 'invalid path' }, { status: 400 }))
        const photo = {
          path: filePath,
          name: String(body?.name || 'upload').slice(0, 120),
          contentType: String(body?.contentType || 'application/octet-stream').slice(0, 80),
          size: Number(body?.size) || 0,
          uploadedAt: new Date().toISOString(),
        }
        const { FieldValue } = await import('firebase-admin/firestore')
        await ref.set({ photos: FieldValue.arrayUnion(photo), status: 'photos_uploaded', updatedAt: new Date().toISOString() }, { merge: true })
        const signedUrl = await signedUrlFor(filePath)
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

        // Referral attribution. If a code is supplied, it must resolve to an
        // approved affiliate — the affiliate name is taken from the record
        // (authoritative), never trusted from the client.
        let affiliateCode = ''
        let affiliateName = ''
        let source = 'field-app'
        const rawCode = String(body?.affiliateCode || '').trim().toUpperCase()
        if (rawCode) {
          const aSnap = await db
            .collection('affiliates')
            .where('code', '==', rawCode)
            .limit(1)
            .get()
          const aDoc = aSnap.docs[0]
          if (!aDoc || aDoc.data().status !== 'approved') {
            return cors(NextResponse.json({ error: 'invalid or inactive affiliate code' }, { status: 400 }))
          }
          affiliateCode = rawCode
          affiliateName = String(aDoc.data().name || '').slice(0, 200)
          source = 'promoter'
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
          affiliateCode,
          affiliateName,
          status: 'new',
          source,
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
        const filterCode = (url.searchParams.get('affiliateCode') || '').trim().toUpperCase()
        let query = db.collection('leads')
        let sortInJs = false
        if (filterCode) {
          // Single-field equality (no composite index needed); sorted in JS below.
          query = query.where('affiliateCode', '==', filterCode).limit(500)
          sortInJs = true
        } else {
          if (today) {
            const start = new Date()
            start.setHours(0, 0, 0, 0)
            query = query.where('createdAt', '>=', start.toISOString())
          }
          query = query.orderBy('createdAt', 'desc').limit(500)
        }
        const snap = await query.get()

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

        if (sortInJs) leads.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
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

    // Affiliates / Promoter program (Phase 1 — code-based, no logins)
    if (resource === 'affiliates') {
      if (!db) return notConfigured()

      // Validate a code (public): GET /api/affiliates/validate?code=
      if (id === 'validate' && method === 'GET') {
        const code = String(url.searchParams.get('code') || '').trim().toUpperCase()
        if (!code) return cors(NextResponse.json({ valid: false, error: 'code required' }, { status: 400 }))
        const snap = await db.collection('affiliates').where('code', '==', code).limit(1).get()
        const doc = snap.docs[0]
        if (!doc || doc.data().status !== 'approved') {
          return cors(NextResponse.json({ valid: false }))
        }
        const ad = doc.data()
        return cors(NextResponse.json({
          valid: true,
          name: ad.name || '',
          code,
          avatarUrl: ad.avatarUrl || '',
          trainingAck: !!ad.trainingAckAt,
        }))
      }

      // Acknowledge basic training (public, by code): POST /api/affiliates/ack-training
      if (id === 'ack-training' && method === 'POST') {
        const body = await request.json()
        const code = String(body?.code || '').trim().toUpperCase()
        if (!code) return cors(NextResponse.json({ error: 'code required' }, { status: 400 }))
        const snap = await db.collection('affiliates').where('code', '==', code).limit(1).get()
        const doc = snap.docs[0]
        if (!doc || doc.data().status !== 'approved') {
          return cors(NextResponse.json({ error: 'invalid or inactive code' }, { status: 400 }))
        }
        await doc.ref.set({ trainingAckAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, { merge: true })
        return cors(NextResponse.json({ ok: true, trainingAck: true }))
      }

      // Finalize an avatar upload (durable URL) + save on the doc:
      // POST /api/affiliates/<id>/avatar-finalize  (public; used right after signup)
      if (id && sub === 'avatar-finalize' && method === 'POST') {
        const bucket = getBucket()
        if (!bucket) return cors(NextResponse.json({ error: 'Storage not configured.' }, { status: 503 }))
        const ref = db.collection('affiliates').doc(id)
        const snap = await ref.get()
        if (!snap.exists) return cors(NextResponse.json({ error: 'affiliate not found' }, { status: 404 }))
        const body = await request.json()
        const filePath = String(body?.path || '')
        if (!filePath.startsWith(`affiliates/${id}/`)) return cors(NextResponse.json({ error: 'invalid path' }, { status: 400 }))
        const token = uuidv4()
        await bucket.file(filePath).setMetadata({ metadata: { firebaseStorageDownloadTokens: token }, cacheControl: 'public, max-age=31536000' })
        const avatarUrl = downloadUrl(bucket.name, filePath, token)
        await ref.set({ avatarPath: filePath, avatarUrl, updatedAt: new Date().toISOString() }, { merge: true })
        return cors(NextResponse.json({ ok: true, url: avatarUrl }))
      }

      // Resend the approval email (code + dashboard link): POST /api/affiliates/<id>/send-link (admin)
      if (id && sub === 'send-link' && method === 'POST') {
        const adminKey = (request.headers.get('x-admin-key') || '').trim()
        if (adminKey !== ADMIN_KEY) return cors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
        const ref = db.collection('affiliates').doc(id)
        const snap = await ref.get()
        if (!snap.exists) return cors(NextResponse.json({ error: 'affiliate not found' }, { status: 404 }))
        const a = snap.data()
        if (!a.code) return cors(NextResponse.json({ error: 'affiliate has no code yet — approve first' }, { status: 400 }))
        const r = await sendAffiliateApproved({ to: a.email, name: a.name, code: a.code })
        return cors(NextResponse.json({ ok: true, sent: r?.sent !== false }))
      }

      // Apply (public): POST /api/affiliates → saved as 'pending'
      if (!id && method === 'POST') {
        const body = await request.json()
        const name = String(body?.name || '').trim().slice(0, 200)
        const email = String(body?.email || '').trim().toLowerCase().slice(0, 320)
        if (!name || !email || !isValidEmail(email)) {
          return cors(NextResponse.json({ error: 'name and a valid email are required' }, { status: 400 }))
        }

        // Recruiter attribution: if they came via another affiliate's ?ref code,
        // record who referred them (used for the Recruiter reward). Name is
        // pulled from the approved affiliate record, never trusted from client.
        let referredByCode = ''
        let referredByName = ''
        const rawRef = String(body?.referredBy || '').trim().toUpperCase()
        if (rawRef) {
          const rSnap = await db.collection('affiliates').where('code', '==', rawRef).limit(1).get()
          const rDoc = rSnap.docs[0]
          if (rDoc && rDoc.data().status === 'approved') {
            referredByCode = rawRef
            referredByName = String(rDoc.data().name || '').slice(0, 200)
          }
        }

        const affiliate = {
          name,
          email,
          phone: String(body?.phone || '').slice(0, 50),
          social: String(body?.social || '').slice(0, 200),
          audience: String(body?.audience || body?.note || '').slice(0, 2000),
          referredByCode,
          referredByName,
          status: 'pending',
          code: null,
          adminNotes: '',
          createdAt: new Date().toISOString(),
          approvedAt: null,
        }
        const ref = await db.collection('affiliates').add(affiliate)
        // Fire-and-forget emails (don't block the response).
        sendAffiliateApplicationReceived({ to: email, name }).catch((e) => console.error('[email] affiliate received failed', e))
        sendAffiliateApplicationNotification({
          name, email, phone: affiliate.phone, social: affiliate.social, audience: affiliate.audience,
        }).catch((e) => console.error('[email] affiliate notify failed', e))
        return cors(NextResponse.json({ ok: true, id: ref.id }))
      }

      // List (admin): GET /api/affiliates — includes referred-lead counts
      if (!id && method === 'GET') {
        const adminKey = (request.headers.get('x-admin-key') || url.searchParams.get('key') || '').trim()
        if (adminKey !== ADMIN_KEY) return cors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
        const snap = await db.collection('affiliates').orderBy('createdAt', 'desc').limit(500).get()
        const affiliates = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        const counts = {}
        const leadsSnap = await db.collection('leads').where('source', '==', 'promoter').limit(2000).get()
        leadsSnap.docs.forEach((d) => {
          const c = d.data().affiliateCode
          if (c) counts[c] = (counts[c] || 0) + 1
        })
        const withCounts = affiliates.map((a) => ({ ...a, leadCount: a.code ? counts[a.code] || 0 : 0 }))
        return cors(NextResponse.json({ affiliates: withCounts }))
      }

      // Update (admin): PUT /api/affiliates/<id> — approve / reject / pause / notes.
      // On first approval: generate a unique code + send the approval email.
      if (id && method === 'PUT') {
        const adminKey = (request.headers.get('x-admin-key') || '').trim()
        if (adminKey !== ADMIN_KEY) return cors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
        const ref = db.collection('affiliates').doc(id)
        const snap = await ref.get()
        if (!snap.exists) return cors(NextResponse.json({ error: 'affiliate not found' }, { status: 404 }))
        const current = snap.data()
        const body = await request.json()
        const update = { updatedAt: new Date().toISOString() }

        if (typeof body?.adminNotes === 'string') update.adminNotes = body.adminNotes.slice(0, 2000)

        const STATUSES = ['pending', 'approved', 'paused', 'rejected']
        let emailAfter = null
        if (body?.status && STATUSES.includes(body.status)) {
          update.status = body.status
          if (body.status === 'approved' && !current.code) {
            let code = ''
            for (let attempt = 0; attempt < 6; attempt += 1) {
              const candidate = genAffiliateCode(current.name)
              const dup = await db.collection('affiliates').where('code', '==', candidate).limit(1).get()
              if (dup.empty) { code = candidate; break }
            }
            if (!code) return cors(NextResponse.json({ error: 'could not generate a unique code; try again' }, { status: 500 }))
            update.code = code
            update.approvedAt = new Date().toISOString()
            emailAfter = { to: current.email, name: current.name, code }
          }
        }

        await ref.set(update, { merge: true })
        if (emailAfter) {
          sendAffiliateApproved(emailAfter).catch((e) => console.error('[email] affiliate approved failed', e))
        }
        const after = (await ref.get()).data()
        return cors(NextResponse.json({ ok: true, affiliate: { id, ...after } }))
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
      // Finalize a direct-uploaded media clip (durable download URL): POST /api/settings/media/finalize
      if (sub === 'finalize' && method === 'POST') {
        const adminKey = (request.headers.get('x-admin-key') || '').trim()
        if (adminKey !== ADMIN_KEY) return cors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
        const bucket = getBucket()
        if (!bucket) return cors(NextResponse.json({ error: 'Storage not configured.' }, { status: 503 }))
        const body = await request.json()
        const filePath = String(body?.path || '')
        if (!filePath.startsWith('media/')) return cors(NextResponse.json({ error: 'invalid path' }, { status: 400 }))
        const token = uuidv4()
        await bucket.file(filePath).setMetadata({ metadata: { firebaseStorageDownloadTokens: token }, cacheControl: 'public, max-age=31536000' })
        return cors(NextResponse.json({ ok: true, url: downloadUrl(bucket.name, filePath, token) }))
      }
      if (method === 'GET') {
        const doc = await db.collection('settings').doc('media').get()
        const data = doc.exists ? doc.data() : {}
        return cors(NextResponse.json({ dishes: data.dishes || null, deck: data.deck || null }))
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
        const deck = (body?.deck && typeof body.deck === 'object') ? {
          name: String(body.deck.name || '').slice(0, 80),
          price: String(body.deck.price || '').slice(0, 20),
          tag: String(body.deck.tag || '').slice(0, 30),
          desc: String(body.deck.desc || '').slice(0, 200),
          video: String(body.deck.video || '').slice(0, 500),
          poster: String(body.deck.poster || '').slice(0, 500),
        } : null
        const payload = { key: 'media', dishes, updatedAt: new Date().toISOString() }
        if (deck) payload.deck = deck
        await db.collection('settings').doc('media').set(payload, { merge: true })
        return cors(NextResponse.json({ ok: true, dishes, deck }))
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

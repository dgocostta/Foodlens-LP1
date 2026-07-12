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
import {
  PROGRAM,
  QUICKSTART_TASKS,
  TARGET_RESTAURANTS,
  computeRank,
  isUnlocked,
} from '@/lib/affiliate-program'

// firebase-admin needs the Node.js runtime (not edge)
export const runtime = 'nodejs'

const ADMIN_KEY = (process.env.ADMIN_KEY || 'foodlens2025').trim()
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024 // 20 MB
const SIGNED_URL_TTL_MS = 60 * 60 * 1000 // 1 hour

function cors(res) {
  res.headers.set('Access-Control-Allow-Origin', '*')
  res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
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

// ---- Lead Bank (cold scraped prospects — collection `leadBank`, separate from inbound `leads`) ----

const BANK_STATUSES = ['new', 'contacted', 'interested', 'not_interested', 'converted']
// Statuses an affiliate may set on a lead assigned to them ('new' is system-only).
const BANK_AFFILIATE_STATUSES = ['contacted', 'interested', 'not_interested', 'converted']
const BANK_EQ_FILTERS = ['country', 'city', 'cuisine', 'cuisineGroup', 'area', 'status', 'batchId']

// Info fields mirrored from the scrape — safe to refresh on re-import.
// CRM fields (status, assignedTo, notes, …) are NEVER touched on re-import.
function sanitizeBankInfo(raw) {
  const s = (v, n) => String(v ?? '').trim().slice(0, n)
  const flag = (v) => (typeof v === 'boolean' ? v : s(v, 20))
  return {
    restaurant: s(raw?.restaurant, 200),
    cuisine: s(raw?.cuisine, 120),
    cuisineGroup: s(raw?.cuisineGroup, 120),
    serviceType: s(raw?.serviceType, 120),
    dineIn: flag(raw?.dineIn),
    takeaway: flag(raw?.takeaway),
    delivery: flag(raw?.delivery),
    price: s(raw?.price, 40),
    rating: Number(raw?.rating) || 0,
    reviews: Number(raw?.reviews) || 0,
    phone: s(raw?.phone, 50),
    website: s(raw?.website, 500),
    email: s(raw?.email, 320).toLowerCase(),
    instagram: s(raw?.instagram, 300),
    facebook: s(raw?.facebook, 300),
    area: s(raw?.area, 200),
    address: s(raw?.address, 400),
    googleMaps: s(raw?.googleMaps, 500),
    city: s(raw?.city, 120),
    country: s(raw?.country, 120),
  }
}

function normalizeBankStatus(v) {
  const st = String(v || '').trim().toLowerCase().replace(/[\s-]+/g, '_')
  return BANK_STATUSES.includes(st) ? st : 'new'
}

// Split a filter object into what Firestore can serve with equality-only
// queries (merged single-field indexes — no composite indexes needed) and
// what gets filtered in JS (inequalities / substring search).
function bankFilterParts(filter) {
  const eq = {}
  for (const f of BANK_EQ_FILTERS) {
    const v = String(filter?.[f] || '').trim()
    if (v) eq[f] = v
  }
  return {
    eq,
    assigned: String(filter?.assigned || '').trim(), // '', 'yes', 'no', or an affiliate code
    ratingMin: Number(filter?.ratingMin) || 0,
    q: String(filter?.q || filter?.search || '').trim().toLowerCase(),
  }
}

function buildBankQuery(col, parts) {
  let query = col
  Object.entries(parts.eq).forEach(([k, v]) => { query = query.where(k, '==', v) })
  if (parts.assigned === 'no') query = query.where('assignedTo', '==', '')
  else if (parts.assigned && parts.assigned !== 'yes') query = query.where('assignedTo', '==', parts.assigned.toUpperCase())
  return query
}

function applyBankJsFilters(items, parts) {
  let out = items
  if (parts.assigned === 'yes') out = out.filter((x) => x.assignedTo)
  if (parts.ratingMin > 0) out = out.filter((x) => (Number(x.rating) || 0) >= parts.ratingMin)
  if (parts.q) {
    out = out.filter((x) =>
      [x.restaurant, x.address, x.area, x.email, x.phone]
        .some((v) => String(v || '').toLowerCase().includes(parts.q)),
    )
  }
  return out
}

// Resolve "select all in filter" to concrete doc ids (capped).
async function collectBankIds(db, filter, cap = 2000) {
  const { FieldPath } = await import('firebase-admin/firestore')
  const parts = bankFilterParts(filter)
  const base = buildBankQuery(db.collection('leadBank'), parts).orderBy(FieldPath.documentId())
  const ids = []
  let cursor = null
  while (ids.length < cap) {
    const snap = await (cursor ? base.startAfter(cursor) : base).limit(500).get()
    if (snap.empty) break
    const rows = applyBankJsFilters(snap.docs.map((d) => ({ id: d.id, ...d.data() })), parts)
    rows.forEach((r) => ids.push(r.id))
    cursor = snap.docs[snap.docs.length - 1].id
    if (snap.size < 500) break
  }
  return ids.slice(0, cap)
}

async function approvedAffiliateByCode(db, code) {
  const c = String(code || '').trim().toUpperCase()
  if (!c) return null
  const snap = await db.collection('affiliates').where('code', '==', c).limit(1).get()
  const doc = snap.docs[0]
  if (!doc || doc.data().status !== 'approved') return null
  return { id: doc.id, ...doc.data() }
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
      const kind = String(body?.kind || '')
      const isImage = /^image\//.test(contentType)
      const isVideo = /^video\//.test(contentType)
      const isPdf = contentType === 'application/pdf'
      const safeName = String(body?.filename || 'upload').replace(/[^\w.\-]+/g, '_').slice(-80)
      let storagePath
      if (scope === 'media') {
        const adminKey = (request.headers.get('x-admin-key') || '').trim()
        if (adminKey !== ADMIN_KEY) return cors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
        if (!isImage && !isVideo) return cors(NextResponse.json({ error: 'only image or video files are allowed' }, { status: 400 }))
        storagePath = `media/${uuidv4()}-${safeName}`
      } else if (scope === 'lead') {
        if (!db) return notConfigured()
        const leadId = String(body?.leadId || '')
        if (!leadId) return cors(NextResponse.json({ error: 'leadId required' }, { status: 400 }))
        const snap = await db.collection('leads').doc(leadId).get()
        if (!snap.exists) return cors(NextResponse.json({ error: 'lead not found' }, { status: 404 }))
        if (kind === 'menu') {
          // Menus are often PDFs grabbed from a restaurant's site — allow PDF too.
          if (!isImage && !isPdf) return cors(NextResponse.json({ error: 'menu must be an image or PDF' }, { status: 400 }))
          storagePath = `leads/${leadId}/menu/${uuidv4()}-${safeName}`
        } else {
          if (!isImage && !isVideo) return cors(NextResponse.json({ error: 'only image or video files are allowed' }, { status: 400 }))
          storagePath = `leads/${leadId}/${uuidv4()}-${safeName}`
        }
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

      // Record a direct-uploaded MENU file (image or PDF): POST /api/leads/<id>/menu-photo-record
      if (id && sub === 'menu-photo-record' && method === 'POST') {
        if (!db) return notConfigured()
        const ref = db.collection('leads').doc(id)
        const snap = await ref.get()
        if (!snap.exists) return cors(NextResponse.json({ error: 'lead not found' }, { status: 404 }))
        const body = await request.json()
        const filePath = String(body?.path || '')
        if (!filePath.startsWith(`leads/${id}/menu/`)) return cors(NextResponse.json({ error: 'invalid path' }, { status: 400 }))
        const menuPhoto = {
          path: filePath,
          name: String(body?.name || 'menu').slice(0, 120),
          contentType: String(body?.contentType || 'application/octet-stream').slice(0, 80),
          size: Number(body?.size) || 0,
          uploadedAt: new Date().toISOString(),
        }
        const { FieldValue } = await import('firebase-admin/firestore')
        await ref.set({ menuPhotos: FieldValue.arrayUnion(menuPhoto), updatedAt: new Date().toISOString() }, { merge: true })
        const signedUrl = await signedUrlFor(filePath)
        return cors(NextResponse.json({ ok: true, menuPhoto: { ...menuPhoto, url: signedUrl } }))
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
        // Admin-created leads (Diego loading pre-launch contacts) carry source
        // 'admin' but can still be credited to an affiliate code.
        const isAdmin = (request.headers.get('x-admin-key') || '').trim() === ADMIN_KEY
        let affiliateCode = ''
        let affiliateName = ''
        let affiliateDocId = ''
        let source = isAdmin ? 'admin' : 'field-app'
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
          affiliateDocId = aDoc.id
          if (!isAdmin) source = 'promoter'
        }

        const LEAD_STATUSES = ['new', 'contacted', 'photos_uploaded', 'video_generating', 'video_sent', 'won', 'lost']
        const sanitizedLocations = Array.isArray(body?.locations)
          ? body.locations.slice(0, 25).map((l) => ({
              name: String(l?.name || '').slice(0, 200),
              area: String(l?.area || '').slice(0, 200),
            })).filter((l) => l.name || l.area)
          : []

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
          menuPhotos: [],
          video: null,
          affiliateCode,
          affiliateName,
          locations: sanitizedLocations,
          note: isAdmin ? String(body?.note || '').slice(0, 2000) : '',
          status: isAdmin && body?.status && LEAD_STATUSES.includes(body.status) ? body.status : 'new',
          source,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        const docRef = await db.collection('leads').add(lead)
        const leadId = docRef.id

        // Log a referral event on the affiliate (append-only, timestamped) so
        // points / leaderboards can attach later without a migration.
        if (affiliateDocId) {
          const { FieldValue } = await import('firebase-admin/firestore')
          db.collection('affiliates').doc(affiliateDocId).set(
            { events: FieldValue.arrayUnion({ type: 'lead_referred', leadId, at: new Date().toISOString() }) },
            { merge: true },
          ).catch((e) => console.error('[affiliate] event log failed', e))
        }

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
            const menuPhotos = await Promise.all(
              (data.menuPhotos || []).map(async (p) => ({
                ...p,
                url: await signedUrlFor(p.path),
              })),
            )
            let video = data.video || null
            if (video?.path) video = { ...video, url: await signedUrlFor(video.path) }
            return { id: d.id, ...data, photos, menuPhotos, video }
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
        if (Array.isArray(body?.locations)) {
          update.locations = body.locations.slice(0, 25).map((l) => ({
            name: String(l?.name || '').slice(0, 200),
            area: String(l?.area || '').slice(0, 200),
          })).filter((l) => l.name || l.area)
        }
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
        // Single-field query (no composite index); count 'won' in JS.
        const leadsSnap = await db.collection('leads').where('affiliateCode', '==', code).limit(1000).get()
        const leadCount = leadsSnap.size
        let signedCount = 0
        leadsSnap.docs.forEach((d) => { if (d.data().status === 'won') signedCount += 1 })
        const checklist = ad.checklist || {}
        const workbook = ad.workbook || { restaurants: [], notes: '' }
        const workbookCount = (workbook.restaurants || []).length
        return cors(NextResponse.json({
          valid: true,
          name: ad.name || '',
          code,
          avatarUrl: ad.avatarUrl || '',
          checklist,
          workbook,
          unlocked: isUnlocked({ checklist, workbookCount }),
          rank: computeRank(signedCount),
          signedCount,
          leadCount,
          founding: !!ad.foundingNumber && ad.foundingNumber <= PROGRAM.foundingCap,
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

      // Tick a quick-start task (public, by code): POST /api/affiliates/checklist
      // body: { code, taskId, done }. Auto tasks (artifact-based) can't be ticked here.
      if (id === 'checklist' && method === 'POST') {
        const body = await request.json()
        const code = String(body?.code || '').trim().toUpperCase()
        const taskId = String(body?.taskId || '')
        const done = body?.done !== false
        if (!code || !taskId) return cors(NextResponse.json({ error: 'code and taskId required' }, { status: 400 }))
        const task = QUICKSTART_TASKS.find((t) => t.id === taskId)
        if (!task || task.auto) return cors(NextResponse.json({ error: 'unknown or auto task' }, { status: 400 }))
        const snap = await db.collection('affiliates').where('code', '==', code).limit(1).get()
        const doc = snap.docs[0]
        if (!doc || doc.data().status !== 'approved') {
          return cors(NextResponse.json({ error: 'invalid or inactive code' }, { status: 400 }))
        }
        const data = doc.data()
        const checklist = { ...(data.checklist || {}) }
        checklist[taskId] = { done, completedAt: done ? new Date().toISOString() : null }
        const update = { checklist, updatedAt: new Date().toISOString() }
        if (done) {
          const { FieldValue } = await import('firebase-admin/firestore')
          update.events = FieldValue.arrayUnion({ type: 'task_done', taskId, at: new Date().toISOString() })
        }
        await doc.ref.set(update, { merge: true })
        const workbookCount = ((data.workbook || {}).restaurants || []).length
        return cors(NextResponse.json({ ok: true, checklist, unlocked: isUnlocked({ checklist, workbookCount }) }))
      }

      // Save the workbook (public, by code): POST /api/affiliates/workbook
      // body: { code, workbook }. NOTE: full-replace for now — move to granular
      // add/update ops later (full-replace can clobber on multi-tab/multi-device).
      if (id === 'workbook' && method === 'POST') {
        const body = await request.json()
        const code = String(body?.code || '').trim().toUpperCase()
        if (!code) return cors(NextResponse.json({ error: 'code required' }, { status: 400 }))
        const snap = await db.collection('affiliates').where('code', '==', code).limit(1).get()
        const doc = snap.docs[0]
        if (!doc || doc.data().status !== 'approved') {
          return cors(NextResponse.json({ error: 'invalid or inactive code' }, { status: 400 }))
        }
        const wb = body?.workbook || {}
        const STATUSES = ['to_contact', 'contacted', 'pitched', 'signed']
        const restaurants = Array.isArray(wb.restaurants)
          ? wb.restaurants.slice(0, 500).map((r) => ({
              id: String(r?.id || '').slice(0, 64) || uuidv4(),
              name: String(r?.name || '').slice(0, 200),
              area: String(r?.area || '').slice(0, 200),
              notes: String(r?.notes || '').slice(0, 1000),
              status: STATUSES.includes(r?.status) ? r.status : 'to_contact',
              leadId: r?.leadId ? String(r.leadId).slice(0, 64) : null, // link to a real lead later
              createdAt: r?.createdAt || new Date().toISOString(),
            }))
          : []
        const workbook = { restaurants, notes: String(wb.notes || '').slice(0, 5000) }
        await doc.ref.set({ workbook, updatedAt: new Date().toISOString() }, { merge: true })
        const checklist = doc.data().checklist || {}
        return cors(NextResponse.json({ ok: true, workbook, unlocked: isUnlocked({ checklist, workbookCount: restaurants.length }) }))
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
        const won = {}
        const leadsSnap = await db.collection('leads').where('affiliateCode', '!=', '').limit(2000).get()
        leadsSnap.docs.forEach((d) => {
          const c = d.data().affiliateCode
          if (!c) return
          counts[c] = (counts[c] || 0) + 1
          if (d.data().status === 'won') won[c] = (won[c] || 0) + 1
        })
        const withCounts = affiliates.map((a) => {
          const signedCount = a.code ? won[a.code] || 0 : 0
          const wbRestaurants = (a.workbook || {}).restaurants || []
          const workbookCount = wbRestaurants.length
          const workbookSigned = wbRestaurants.filter((r) => r.status === 'signed').length
          const checklistDone = QUICKSTART_TASKS.filter((t) =>
            t.auto === 'workbook_target' ? workbookCount >= TARGET_RESTAURANTS : !!(a.checklist?.[t.id]?.done),
          ).length
          return {
            ...a,
            leadCount: a.code ? counts[a.code] || 0 : 0,
            signedCount,
            rank: computeRank(signedCount),
            checklistDone,
            checklistTotal: QUICKSTART_TASKS.length,
            workbookCount,
            workbookSigned,
          }
        })
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
            // Lifetime-rate lock-in PERK flag (separate from rank): sequence among
            // approved affiliates. <= foundingCap keeps the top rate for life.
            const approvedSnap = await db.collection('affiliates').where('status', '==', 'approved').limit(1000).get()
            update.foundingNumber = approvedSnap.size + 1
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

    // Lead Bank — cold scraped prospects (collection `leadBank`, doc id = placeId)
    if (resource === 'lead-bank') {
      if (!db) return notConfigured()
      const col = db.collection('leadBank')
      const now = new Date().toISOString()

      // Affiliate-facing (code-gated, no admin key): GET /api/lead-bank/assigned?code=
      if (id === 'assigned' && !sub && method === 'GET') {
        const code = String(url.searchParams.get('code') || '').trim().toUpperCase()
        if (!code) return cors(NextResponse.json({ error: 'code required' }, { status: 400 }))
        const aff = await approvedAffiliateByCode(db, code)
        if (!aff) return cors(NextResponse.json({ error: 'invalid or inactive code' }, { status: 400 }))
        const snap = await col.where('assignedTo', '==', code).limit(500).get()
        const items = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => String(b.assignedAt || '').localeCompare(String(a.assignedAt || '')))
        return cors(NextResponse.json({ ok: true, items }))
      }

      // Affiliate work action (code must own the record): POST /api/lead-bank/assigned/update
      // body: { code, id, status?, notes? }
      if (id === 'assigned' && sub === 'update' && method === 'POST') {
        const body = await request.json()
        const code = String(body?.code || '').trim().toUpperCase()
        const rowId = String(body?.id || '')
        if (!code || !rowId) return cors(NextResponse.json({ error: 'code and id required' }, { status: 400 }))
        const aff = await approvedAffiliateByCode(db, code)
        if (!aff) return cors(NextResponse.json({ error: 'invalid or inactive code' }, { status: 400 }))
        const ref = col.doc(rowId)
        const snap = await ref.get()
        if (!snap.exists) return cors(NextResponse.json({ error: 'lead not found' }, { status: 404 }))
        if (snap.data().assignedTo !== code) return cors(NextResponse.json({ error: 'not assigned to you' }, { status: 403 }))
        const update = { updatedAt: now }
        if (body?.status && BANK_AFFILIATE_STATUSES.includes(body.status)) {
          update.status = body.status
          if (body.status === 'contacted') update.lastContacted = now
        }
        if (typeof body?.notes === 'string') update.notes = body.notes.slice(0, 2000)
        await ref.set(update, { merge: true })
        return cors(NextResponse.json({ ok: true, item: { id: rowId, ...snap.data(), ...update } }))
      }

      // Everything below is admin-only.
      const adminKey = (request.headers.get('x-admin-key') || '').trim()
      if (adminKey !== ADMIN_KEY) return cors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))

      // Bulk upsert by placeId: POST /api/lead-bank/import
      // body: { batch: { source, city, country }, leads: [...] }
      // The scraper chat, CSV/JSON upload, and manual add all land here.
      if (id === 'import' && method === 'POST') {
        const body = await request.json()
        const rows = Array.isArray(body?.leads) ? body.leads.slice(0, 2000) : []
        if (!rows.length) return cors(NextResponse.json({ error: 'leads array required' }, { status: 400 }))
        const source = String(body?.batch?.source || 'import').slice(0, 80)
        const batchCity = String(body?.batch?.city || '').slice(0, 120)
        const batchCountry = String(body?.batch?.country || '').slice(0, 120)
        const batchId = uuidv4()
        let inserted = 0
        let updated = 0

        for (let start = 0; start < rows.length; start += 300) {
          const chunk = rows.slice(start, start + 300)
          const prepared = chunk.map((raw) => {
            const placeIdRaw = String(raw?.placeId || '').trim().replace(/[\/\s]+/g, '_').slice(0, 300)
            return { docId: placeIdRaw || `manual-${uuidv4()}`, raw }
          })
          const snaps = await db.getAll(...prepared.map((p) => col.doc(p.docId)))
          const write = db.batch()
          snaps.forEach((snap, i) => {
            const { docId, raw } = prepared[i]
            const info = sanitizeBankInfo(raw)
            info.placeId = docId
            if (!info.city) info.city = batchCity
            if (!info.country) info.country = batchCountry
            if (snap.exists) {
              // Refresh info fields with non-empty incoming values only —
              // PRESERVE status / assignedTo / notes / follow-ups (manual work).
              const update = { updatedAt: now, lastImportBatchId: batchId }
              for (const [k, v] of Object.entries(info)) {
                if (typeof v === 'boolean' || (typeof v === 'number' && v > 0) || (typeof v === 'string' && v)) update[k] = v
              }
              write.set(col.doc(docId), update, { merge: true })
              updated += 1
            } else {
              write.set(col.doc(docId), {
                ...info,
                status: normalizeBankStatus(raw?.status),
                assignedTo: '',
                assignedName: String(raw?.assignedName || '').slice(0, 200),
                assignedAt: null,
                notes: String(raw?.notes || '').slice(0, 2000),
                lastContacted: String(raw?.lastContacted || '').slice(0, 40),
                nextFollowup: String(raw?.nextFollowup || '').slice(0, 40),
                batchId,
                source,
                importedAt: now,
                createdAt: now,
                updatedAt: now,
              })
              inserted += 1
            }
          })
          await write.commit()
        }

        await db.collection('leadBankBatches').doc(batchId).set({
          batchId, source, city: batchCity, country: batchCountry,
          total: rows.length, inserted, updated, createdAt: now,
        })
        return cors(NextResponse.json({ ok: true, batchId, inserted, updated }))
      }

      // Facets + KPI counts (single slim scan — fine at Lead Bank scale, admin-only):
      // GET /api/lead-bank/facets
      if (id === 'facets' && method === 'GET') {
        const snap = await col
          .select('country', 'city', 'cuisine', 'cuisineGroup', 'area', 'status', 'assignedTo')
          .limit(20000)
          .get()
        const counts = { total: 0, new: 0, assigned: 0 }
        const countries = {}
        const cities = {}
        const cityCountry = {}
        const cuisines = {}
        const cuisineGroups = {}
        const areas = {}
        const statuses = {}
        const bump = (map, key) => { if (key) map[key] = (map[key] || 0) + 1 }
        snap.docs.forEach((d) => {
          const x = d.data()
          counts.total += 1
          if ((x.status || 'new') === 'new') counts.new += 1
          if (x.assignedTo) counts.assigned += 1
          bump(countries, x.country)
          bump(cities, x.city)
          bump(cuisines, x.cuisine)
          bump(cuisineGroups, x.cuisineGroup)
          bump(areas, x.area)
          bump(statuses, x.status || 'new')
          if (x.city && x.country && !cityCountry[x.city]) cityCountry[x.city] = x.country
        })
        const batchesSnap = await db.collection('leadBankBatches').orderBy('createdAt', 'desc').limit(30).get()
        const batches = batchesSnap.docs.map((d) => d.data())
        return cors(NextResponse.json({ ...counts, countries, cities, cityCountry, cuisines, cuisineGroups, areas, statuses, batches }))
      }

      // Bulk action: POST /api/lead-bank/bulk
      // body: { ids: [...] } OR { filter: {...} }, action: 'assign'|'status'|'delete', value
      if (id === 'bulk' && method === 'POST') {
        const body = await request.json()
        const action = String(body?.action || '')
        let ids = Array.isArray(body?.ids) ? body.ids.map((x) => String(x)).filter(Boolean).slice(0, 2000) : []
        if (!ids.length && body?.filter && typeof body.filter === 'object') {
          ids = await collectBankIds(db, body.filter)
        }
        if (!ids.length) return cors(NextResponse.json({ error: 'no rows matched' }, { status: 400 }))

        let patch = null
        if (action === 'assign') {
          const code = String(body?.value || '').trim().toUpperCase()
          if (!code) {
            patch = { assignedTo: '', assignedName: '', assignedAt: null }
          } else {
            const aff = await approvedAffiliateByCode(db, code)
            if (!aff) return cors(NextResponse.json({ error: 'invalid or inactive affiliate code' }, { status: 400 }))
            patch = { assignedTo: code, assignedName: String(aff.name || '').slice(0, 200), assignedAt: now }
          }
        } else if (action === 'status') {
          if (!BANK_STATUSES.includes(body?.value)) return cors(NextResponse.json({ error: 'invalid status' }, { status: 400 }))
          patch = { status: body.value }
        } else if (action !== 'delete') {
          return cors(NextResponse.json({ error: 'invalid action' }, { status: 400 }))
        }

        for (let start = 0; start < ids.length; start += 400) {
          const chunk = ids.slice(start, start + 400)
          const write = db.batch()
          chunk.forEach((docId) => {
            const ref = col.doc(docId)
            if (action === 'delete') write.delete(ref)
            else write.set(ref, { ...patch, updatedAt: now }, { merge: true })
          })
          await write.commit()
        }
        return cors(NextResponse.json({ ok: true, action, count: ids.length }))
      }

      // List with filters + cursor pagination: GET /api/lead-bank
      // Equality filters run in Firestore (merged single-field indexes, ordered
      // by doc id — no composite indexes needed). assigned=yes / ratingMin / q
      // are JS-filtered over a scan window, so filtered pages may return fewer
      // than `limit` while still carrying a nextCursor.
      if (!id && method === 'GET') {
        const parts = bankFilterParts(Object.fromEntries(url.searchParams))
        const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 100, 1), 250)
        const cursor = String(url.searchParams.get('cursor') || '').trim()
        const { FieldPath } = await import('firebase-admin/firestore')
        let query = buildBankQuery(col, parts).orderBy(FieldPath.documentId())
        if (cursor) query = query.startAfter(cursor)
        const needsJs = parts.assigned === 'yes' || parts.ratingMin > 0 || !!parts.q
        const windowSize = needsJs ? Math.min(500, limit * 4) : limit
        const snap = await query.limit(windowSize).get()
        const scannedFull = snap.size === windowSize
        const lastScannedId = snap.size ? snap.docs[snap.size - 1].id : null
        let items = applyBankJsFilters(snap.docs.map((d) => ({ id: d.id, ...d.data() })), parts)
        let nextCursor = null
        if (items.length > limit) {
          items = items.slice(0, limit)
          nextCursor = items[items.length - 1].id
        } else if (scannedFull) {
          nextCursor = lastScannedId
        }
        return cors(NextResponse.json({ items, nextCursor }))
      }

      // Update one prospect: PATCH /api/lead-bank/<id>
      if (id && !sub && method === 'PATCH') {
        const ref = col.doc(id)
        const snap = await ref.get()
        if (!snap.exists) return cors(NextResponse.json({ error: 'lead not found' }, { status: 404 }))
        const body = await request.json()
        const update = { updatedAt: now }
        if (body?.status && BANK_STATUSES.includes(body.status)) update.status = body.status
        if (typeof body?.notes === 'string') update.notes = body.notes.slice(0, 2000)
        if (typeof body?.lastContacted === 'string') update.lastContacted = body.lastContacted.slice(0, 40)
        if (typeof body?.nextFollowup === 'string') update.nextFollowup = body.nextFollowup.slice(0, 40)
        if (body?.assignedTo !== undefined) {
          const code = String(body.assignedTo || '').trim().toUpperCase()
          if (!code) {
            update.assignedTo = ''
            update.assignedName = ''
            update.assignedAt = null
          } else {
            const aff = await approvedAffiliateByCode(db, code)
            if (!aff) return cors(NextResponse.json({ error: 'invalid or inactive affiliate code' }, { status: 400 }))
            update.assignedTo = code
            update.assignedName = String(aff.name || '').slice(0, 200)
            update.assignedAt = now
          }
        }
        for (const f of ['restaurant', 'cuisine', 'area', 'address', 'phone', 'email', 'website', 'instagram']) {
          if (typeof body?.[f] === 'string') update[f] = body[f].trim().slice(0, 500)
        }
        await ref.set(update, { merge: true })
        return cors(NextResponse.json({ ok: true, item: { id, ...snap.data(), ...update } }))
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
export async function PATCH(request) {
  return route(request, 'PATCH')
}
export async function DELETE(request) {
  return route(request, 'DELETE')
}

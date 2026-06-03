// Client-side upload helpers.
// Small files (images) go through our API. Large files (videos) upload
// straight to Firebase Storage via a signed URL, dodging the serverless
// request-body size limit. Direct uploads require a CORS rule on the bucket.

async function jsonOrThrow(res, fallback) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || fallback)
  return data
}

async function putToStorage(uploadUrl, contentType, file) {
  const put = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': contentType }, body: file })
  if (!put.ok) {
    throw new Error('Storage rejected the upload — check the bucket CORS rule.')
  }
}

// Upload a file and attach it to a lead. Returns the stored photo record.
export async function uploadLeadFile(leadId, file) {
  const isVideo = /^video\//.test(file.type)
  if (!isVideo) {
    const body = new FormData()
    body.append('file', file)
    const res = await fetch(`/api/leads/${leadId}/photo`, { method: 'POST', body })
    const data = await jsonOrThrow(res, 'Upload failed')
    return data.photo
  }
  const sign = await fetch('/api/uploads/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scope: 'lead', leadId, filename: file.name, contentType: file.type }),
  })
  const sd = await jsonOrThrow(sign, 'Could not start upload')
  await putToStorage(sd.uploadUrl, sd.contentType, file)
  const rec = await fetch(`/api/leads/${leadId}/photo-record`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: sd.path, name: file.name, contentType: file.type, size: file.size }),
  })
  const rd = await jsonOrThrow(rec, 'Could not record upload')
  return rd.photo
}

// Upload a demo-menu clip (admin). Returns a durable public URL.
export async function uploadMediaFile(file, adminKey) {
  const isVideo = /^video\//.test(file.type)
  if (!isVideo) {
    const body = new FormData()
    body.append('file', file)
    const res = await fetch('/api/settings/media/upload', { method: 'POST', headers: { 'X-Admin-Key': adminKey }, body })
    const data = await jsonOrThrow(res, 'Upload failed')
    return data.url
  }
  const sign = await fetch('/api/uploads/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey },
    body: JSON.stringify({ scope: 'media', filename: file.name, contentType: file.type }),
  })
  const sd = await jsonOrThrow(sign, 'Could not start upload')
  await putToStorage(sd.uploadUrl, sd.contentType, file)
  const fin = await fetch('/api/settings/media/finalize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey },
    body: JSON.stringify({ path: sd.path }),
  })
  const fd = await jsonOrThrow(fin, 'Could not finalize upload')
  return fd.url
}

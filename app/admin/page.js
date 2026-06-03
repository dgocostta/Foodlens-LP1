'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Lock, RefreshCw, Users, Calendar, Instagram, Phone, Mail, ArrowLeft, Film,
  Save, RotateCcw, ExternalLink, Play, X, Copy, MessageCircle, Wand2, Image as ImageIcon,
  Video, ListChecks, Clapperboard, Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import { DEFAULT_DISHES } from '@/lib/foodlens-data'
import { Logo } from '@/components/logo'

const PIPELINE = ['new', 'contacted', 'photos_uploaded', 'video_generating', 'video_sent', 'won', 'lost']

const STATUS_STYLES = {
  new: 'border-zinc-600 text-zinc-300',
  contacted: 'border-amber-500/50 text-amber-300',
  photos_uploaded: 'border-orange-500/50 text-orange-300',
  video_generating: 'border-blue-500/50 text-blue-300',
  video_sent: 'border-violet-500/50 text-violet-300',
  won: 'border-green-500/50 text-green-300',
  lost: 'border-red-500/50 text-red-300',
}
const STATUS_LABELS = {
  new: 'New', contacted: 'Contacted', photos_uploaded: 'Photos in',
  video_generating: 'Video queued', video_sent: 'Video sent', won: 'Won', lost: 'Lost',
}

const StatusBadge = ({ status }) => {
  const s = status || 'new'
  return (
    <Badge variant="outline" className={STATUS_STYLES[s] || STATUS_STYLES.new}>
      {STATUS_LABELS[s] || s}
    </Badge>
  )
}

const StatCard = ({ icon: Icon, label, value }) => (
  <Card className="bg-zinc-900/60 border-zinc-800 p-4">
    <div className="flex items-center justify-between">
      <Icon size={16} className="text-orange-400" />
      <span className="text-2xl font-bold">{value}</span>
    </div>
    <div className="text-xs text-zinc-500 mt-1 uppercase tracking-wider">{label}</div>
  </Card>
)

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [key, setKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('leads')

  const [leads, setLeads] = useState([])
  const [todayOnly, setTodayOnly] = useState(false)
  const [loadingLeads, setLoadingLeads] = useState(false)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('fl_admin_key') : null
    if (saved) { setKey(saved); tryLogin(saved) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const tryLogin = async (k) => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: k }),
      })
      if (!res.ok) throw new Error('Invalid key')
      localStorage.setItem('fl_admin_key', k)
      setAuthed(true)
      loadLeads(k, todayOnly)
    } catch (e) {
      toast.error('Wrong key')
      localStorage.removeItem('fl_admin_key')
    } finally {
      setLoading(false)
    }
  }

  const loadLeads = async (k = key, today = todayOnly) => {
    setLoadingLeads(true)
    try {
      const res = await fetch(`/api/leads?today=${today ? 1 : 0}`, { headers: { 'X-Admin-Key': k } })
      const data = await res.json()
      setLeads(data.leads || [])
    } catch (e) {
      toast.error('Failed to load leads')
    } finally {
      setLoadingLeads(false)
    }
  }

  const updateStatus = async (lead, status) => {
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Key': key },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Update failed')
      setLeads((arr) => arr.map((l) => (l.id === lead.id ? { ...l, status } : l)))
      setSelected((s) => (s && s.id === lead.id ? { ...s, status } : s))
      toast.success(`Moved to "${STATUS_LABELS[status] || status}"`)
    } catch (e) {
      toast.error(e.message)
    }
  }

  const generateVideo = async (lead) => {
    try {
      const res = await fetch(`/api/leads/${lead.id}/generate-video`, {
        method: 'POST', headers: { 'X-Admin-Key': key },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed')
      setLeads((arr) => arr.map((l) => (l.id === lead.id ? { ...l, status: 'video_generating' } : l)))
      setSelected((s) => (s && s.id === lead.id ? { ...s, status: 'video_generating' } : s))
      toast.success(data.note || 'Queued for video generation.')
    } catch (e) {
      toast.error(e.message)
    }
  }

  if (!authed) {
    return (
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <Card className="bg-zinc-900 border-zinc-800 p-8 max-w-sm w-full">
          <div className="flex justify-center mb-5"><Logo size="lg" /></div>
          <h1 className="text-xl font-bold text-center mb-1">Admin Access</h1>
          <p className="text-sm text-zinc-500 text-center mb-6 flex items-center justify-center gap-1.5"><Lock size={12} /> Enter your team key</p>
          <form onSubmit={(e) => { e.preventDefault(); tryLogin(key) }} className="space-y-3">
            <Input type="password" placeholder="Admin key" value={key} onChange={(e) => setKey(e.target.value)}
              className="bg-zinc-950 border-zinc-800 focus-visible:ring-orange-500" autoFocus />
            <Button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
              {loading ? 'Checking…' : 'Unlock'}
            </Button>
          </form>
          <Link href="/" className="mt-5 block text-center text-xs text-zinc-500 hover:text-orange-400">← Back to site</Link>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 overflow-x-hidden">
      <nav className="glass sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="p-1.5 rounded hover:bg-white/5"><ArrowLeft size={16} /></Link>
            <Logo size="sm" />
            <Badge variant="outline" className="ml-1 border-orange-500/40 text-orange-400 text-[10px]">ADMIN</Badge>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setTab('leads')}
              className={`text-sm px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${tab === 'leads' ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>
              <ListChecks size={14} /> Leads
            </button>
            <button onClick={() => setTab('media')}
              className={`text-sm px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${tab === 'media' ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>
              <Clapperboard size={14} /> Media
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {tab === 'leads' ? (
          <>
            <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Leads</h1>
                <p className="text-zinc-500 mt-1">Your pipeline — click any lead to open it.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant={todayOnly ? 'default' : 'outline'}
                  onClick={() => { setTodayOnly(true); loadLeads(key, true) }}
                  className={todayOnly ? 'bg-orange-500 hover:bg-orange-600' : 'border-zinc-800'}>Today</Button>
                <Button size="sm" variant={!todayOnly ? 'default' : 'outline'}
                  onClick={() => { setTodayOnly(false); loadLeads(key, false) }}
                  className={!todayOnly ? 'bg-orange-500 hover:bg-orange-600' : 'border-zinc-800'}>All Time</Button>
                <Button size="sm" variant="outline" onClick={() => loadLeads()} className="border-zinc-800">
                  <RefreshCw size={13} className={`mr-1.5 ${loadingLeads ? 'animate-spin' : ''}`} /> Refresh
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              <StatCard icon={Users} label="Total Leads" value={leads.length} />
              <StatCard icon={ImageIcon} label="With Photos" value={leads.filter((l) => (l.photos || []).length).length} />
              <StatCard icon={Mail} label="With Email" value={leads.filter((l) => l.email).length} />
              <StatCard icon={Calendar} label={todayOnly ? 'Today' : 'All Time'} value={leads.length} />
            </div>

            <Card className="bg-zinc-900/60 border-zinc-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-950/80 text-zinc-500 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="text-left px-4 py-3">Restaurant</th>
                      <th className="text-left px-4 py-3">Owner</th>
                      <th className="text-left px-4 py-3">Email</th>
                      <th className="text-left px-4 py-3">Photos</th>
                      <th className="text-left px-4 py-3">Status</th>
                      <th className="text-left px-4 py-3">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-12 text-center text-zinc-500">No leads yet. Go close some! 🔥</td></tr>
                    )}
                    {leads.map((l) => (
                      <tr key={l.id} onClick={() => setSelected(l)}
                        className="border-t border-zinc-800 hover:bg-white/[0.03] cursor-pointer">
                        <td className="px-4 py-3 font-medium">{l.restaurantName}</td>
                        <td className="px-4 py-3 text-zinc-300">{l.ownerName}</td>
                        <td className="px-4 py-3 text-zinc-400">{l.email || <span className="text-zinc-600">—</span>}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="border-zinc-700 text-zinc-300">{(l.photos || []).length}</Badge>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                        <td className="px-4 py-3 text-zinc-500 text-xs">{new Date(l.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        ) : (
          <MediaManagement adminKey={key} />
        )}
      </div>

      {selected && (
        <LeadDetail
          lead={selected}
          onClose={() => setSelected(null)}
          onStatus={(s) => updateStatus(selected, s)}
          onGenerate={() => generateVideo(selected)}
        />
      )}
    </main>
  )
}

const LeadDetail = ({ lead, onClose, onStatus, onGenerate }) => {
  const digits = (lead.phone || '').replace(/[^\d]/g, '')
  const ig = (lead.instagram || '').replace(/^@/, '')
  const copy = (txt) => navigator.clipboard.writeText(txt).then(
    () => toast.success('Copied'), () => toast.error('Could not copy'))

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-zinc-950 border-l border-zinc-800 h-full overflow-y-auto">
        <div className="sticky top-0 glass px-5 py-4 flex items-center justify-between border-b border-zinc-800">
          <div>
            <div className="text-lg font-bold leading-tight">{lead.restaurantName}</div>
            <div className="text-xs text-zinc-500">{lead.ownerName}</div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-6">
          {/* Pipeline */}
          <div>
            <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Pipeline stage</div>
            <div className="flex flex-wrap gap-1.5">
              {PIPELINE.map((s) => (
                <button key={s} onClick={() => onStatus(s)}
                  className={`text-xs px-2.5 py-1 rounded-full border ${(lead.status || 'new') === s ? 'bg-orange-500 border-orange-500 text-white' : 'border-zinc-700 text-zinc-400 hover:border-orange-500/60'}`}>
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Contact quick actions */}
          <div>
            <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Contact</div>
            <div className="space-y-2">
              <ContactRow icon={Mail} label={lead.email || '—'}
                actions={lead.email && [
                  { node: <a href={`mailto:${lead.email}`} className="hover:text-orange-400"><Mail size={14} /></a> },
                  { node: <button onClick={() => copy(lead.email)} className="hover:text-orange-400"><Copy size={14} /></button> },
                ]} />
              <ContactRow icon={Phone} label={lead.phone || '—'}
                actions={lead.phone && [
                  { node: <a href={`tel:${lead.phone}`} className="hover:text-orange-400"><Phone size={14} /></a> },
                  { node: <a href={`https://wa.me/${digits}`} target="_blank" rel="noreferrer" className="hover:text-orange-400"><MessageCircle size={14} /></a> },
                ]} />
              <ContactRow icon={Instagram} label={lead.instagram || '—'}
                actions={ig && [
                  { node: <a href={`https://instagram.com/${ig}`} target="_blank" rel="noreferrer" className="hover:text-orange-400"><ExternalLink size={14} /></a> },
                ]} />
            </div>
          </div>

          {/* Photos / uploads */}
          <div>
            <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Uploads ({(lead.photos || []).length})</div>
            {(lead.photos || []).length === 0 ? (
              <p className="text-sm text-zinc-600">No photos or videos uploaded.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {(lead.photos || []).map((p, i) => (
                  <a key={i} href={p.url || '#'} target="_blank" rel="noreferrer"
                    className="relative aspect-square rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-orange-500">
                    {p.url && /^video\//.test(p.contentType || '') ? (
                      <video src={p.url} muted className="w-full h-full object-cover" />
                    ) : p.url ? (
                      <img src={p.url} alt={p.name || 'upload'} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600"><ImageIcon size={16} /></div>
                    )}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Video automation */}
          <div>
            <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Video</div>
            {lead.video?.url ? (
              <a href={lead.video.url} target="_blank" rel="noreferrer" className="text-sm text-orange-400 hover:underline flex items-center gap-1.5">
                <Play size={14} /> View generated video
              </a>
            ) : (
              <Button size="sm" onClick={onGenerate} className="bg-orange-500 hover:bg-orange-600 text-white">
                <Wand2 size={14} className="mr-1.5" /> Generate video from photos
              </Button>
            )}
          </div>

          <div className="text-xs text-zinc-600 border-t border-zinc-800 pt-4">
            Lead ID: {lead.id}<br />
            Created: {new Date(lead.createdAt).toLocaleString()}
            {lead.updatedAt && <><br />Updated: {new Date(lead.updatedAt).toLocaleString()}</>}
          </div>
        </div>
      </div>
    </div>
  )
}

const ContactRow = ({ icon: Icon, label, actions }) => (
  <div className="flex items-center justify-between gap-2 bg-zinc-900/60 border border-zinc-800 rounded-lg px-3 py-2">
    <div className="flex items-center gap-2 min-w-0">
      <Icon size={14} className="text-zinc-500 flex-shrink-0" />
      <span className="text-sm text-zinc-300 truncate">{label}</span>
    </div>
    {actions && <div className="flex items-center gap-3 text-zinc-400 flex-shrink-0">{actions.map((a, i) => <span key={i}>{a.node}</span>)}</div>}
  </div>
)

const MediaManagement = ({ adminKey }) => {
  const [dishes, setDishes] = useState(DEFAULT_DISHES)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [uploadingIdx, setUploadingIdx] = useState(null)
  const fileRefs = useRef({})

  useEffect(() => {
    fetch('/api/settings/media').then((r) => r.json()).then((d) => {
      if (Array.isArray(d?.dishes) && d.dishes.length) setDishes(d.dishes)
      setLoaded(true)
    }).catch(() => setLoaded(true))
  }, [])

  const update = (i, field, value) => {
    setDishes((arr) => arr.map((d, idx) => (idx === i ? { ...d, [field]: value } : d)))
  }

  const uploadClip = async (i, file) => {
    if (!file) return
    setUploadingIdx(i)
    try {
      const body = new FormData()
      body.append('file', file)
      const res = await fetch('/api/settings/media/upload', {
        method: 'POST', headers: { 'X-Admin-Key': adminKey }, body,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      update(i, 'video', data.url)
      toast.success('Clip uploaded. Click Save to publish.')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setUploadingIdx(null)
    }
  }

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/media', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey },
        body: JSON.stringify({ dishes }),
      })
      if (!res.ok) throw new Error('Save failed')
      toast.success('Saved and published. The live menu now uses these.')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const reset = () => { setDishes(DEFAULT_DISHES); toast.info('Reset to defaults. Click Save to persist.') }

  return (
    <div>
      <div className="flex items-end justify-between mb-5 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Film size={18} className="text-orange-400" />
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Media</h1>
          </div>
          <p className="text-zinc-500 text-sm md:text-base">Upload your own clips (they're hosted on our storage and won't break), or paste an mp4/webm URL.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={reset} className="border-zinc-800"><RotateCcw size={13} className="mr-1.5" /> Reset</Button>
          <Button size="sm" onClick={save} disabled={saving || !loaded} className="bg-orange-500 hover:bg-orange-600 text-white">
            <Save size={13} className="mr-1.5" /> {saving ? 'Saving…' : 'Save & Publish'}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {dishes.map((d, i) => (
          <Card key={d.id || i} className="bg-zinc-900/60 border-zinc-800 p-5">
            <div className="flex items-start gap-4">
              <div className="relative w-24 h-32 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 flex-shrink-0">
                {d.video ? (
                  <video src={d.video} poster={d.poster} muted loop playsInline className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-700"><Play size={20} /></div>
                )}
                <div className="absolute top-1 left-1 text-[9px] font-bold bg-black/70 text-orange-400 px-1.5 py-0.5 rounded">#{i + 1}</div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <Input value={d.name} onChange={(e) => update(i, 'name', e.target.value)} placeholder="Dish name" className="col-span-2 bg-zinc-950 border-zinc-800 h-9 text-sm" />
                  <Input value={d.price} onChange={(e) => update(i, 'price', e.target.value)} placeholder="€24" className="bg-zinc-950 border-zinc-800 h-9 text-sm" />
                </div>
                <Input value={d.tag} onChange={(e) => update(i, 'tag', e.target.value)} placeholder="Chef's Pick" className="bg-zinc-950 border-zinc-800 h-9 text-sm" />
                <Input value={d.desc} onChange={(e) => update(i, 'desc', e.target.value)} placeholder="One-line description" className="bg-zinc-950 border-zinc-800 h-9 text-sm" />
                <Input value={d.video} onChange={(e) => update(i, 'video', e.target.value)} placeholder="https://...video.mp4" className="bg-zinc-950 border-zinc-800 h-9 text-xs font-mono" />
                <div className="flex items-center gap-2">
                  <input ref={(el) => (fileRefs.current[i] = el)} type="file" accept="video/*,image/*" className="hidden"
                    onChange={(e) => uploadClip(i, e.target.files?.[0])} />
                  <Button size="sm" variant="outline" disabled={uploadingIdx === i}
                    onClick={() => fileRefs.current[i]?.click()} className="border-zinc-800 text-xs">
                    <Upload size={12} className="mr-1.5" /> {uploadingIdx === i ? 'Uploading…' : 'Upload clip'}
                  </Button>
                  <Input value={d.poster} onChange={(e) => update(i, 'poster', e.target.value)} placeholder="Poster URL (optional)" className="bg-zinc-950 border-zinc-800 h-9 text-xs font-mono flex-1" />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

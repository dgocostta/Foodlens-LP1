'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Lock, RefreshCw, Users, Calendar, Instagram, Phone, Mail, ArrowLeft, Film,
  Save, RotateCcw, ExternalLink, Play, X, Copy, MessageCircle, Wand2, Image as ImageIcon,
  Video, ListChecks, Clapperboard, Upload,
  UserPlus, Check, Ban, Pause, Clock, Filter, Tag, Send, ChevronRight,
  Plus, Trash2, MapPin, FileText, Database,
} from 'lucide-react'
import { toast } from 'sonner'
import { DEFAULT_DISHES, DEFAULT_DECK } from '@/lib/foodlens-data'
import { Logo } from '@/components/logo'
import { uploadMediaFile, uploadLeadFile, uploadLeadMenuFile } from '@/lib/upload'
import { LeadBankTab } from './lead-bank'

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
  const [refFilter, setRefFilter] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [affCodes, setAffCodes] = useState([])

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
      loadAffCodes(k)
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

  const loadAffCodes = async (k = key) => {
    try {
      const res = await fetch('/api/affiliates', { headers: { 'X-Admin-Key': k } })
      const data = await res.json().catch(() => ({}))
      setAffCodes((data.affiliates || []).filter((a) => a.code).map((a) => a.code))
    } catch (e) { /* non-fatal */ }
  }

  const addLead = async (payload) => {
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Key': key },
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'Could not add lead')
    setLeads((arr) => [data.lead, ...arr])
    return data.lead
  }

  const patchLeadLocal = (id, patch) => {
    setLeads((arr) => arr.map((l) => (l.id === id ? { ...l, ...patch } : l)))
    setSelected((s) => (s && s.id === id ? { ...s, ...patch } : s))
  }

  const referrers = Array.from(new Set(leads.map((l) => l.affiliateName).filter(Boolean))).sort()
  const shownLeads = leads.filter((l) => {
    if (refFilter === 'all') return true
    if (refFilter === '__direct__') return !l.affiliateCode
    return l.affiliateName === refFilter
  })

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
            <button onClick={() => setTab('leadbank')}
              className={`text-sm px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${tab === 'leadbank' ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>
              <Database size={14} /> Lead Bank
            </button>
            <button onClick={() => setTab('media')}
              className={`text-sm px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${tab === 'media' ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>
              <Clapperboard size={14} /> Media
            </button>
            <button onClick={() => setTab('affiliates')}
              className={`text-sm px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${tab === 'affiliates' ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>
              <UserPlus size={14} /> Affiliates
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {tab === 'leads' && (
          <>
            <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Leads</h1>
                <p className="text-zinc-500 mt-1">Your pipeline — click any lead to open it.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => setShowAdd(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
                  <Plus size={14} className="mr-1.5" /> Add lead
                </Button>
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

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <StatCard icon={Users} label="Total Leads" value={leads.length} />
              <StatCard icon={ImageIcon} label="With Photos" value={leads.filter((l) => (l.photos || []).length).length} />
              <StatCard icon={UserPlus} label="Via Promoters" value={leads.filter((l) => l.affiliateCode).length} />
              <StatCard icon={Calendar} label={todayOnly ? 'Today' : 'All Time'} value={leads.length} />
            </div>

            {referrers.length > 0 && (
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="text-xs text-zinc-500 flex items-center gap-1.5"><Filter size={12} /> Referred by</span>
                <select value={refFilter} onChange={(e) => setRefFilter(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg text-sm px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500">
                  <option value="all">All sources</option>
                  <option value="__direct__">Direct (no promoter)</option>
                  {referrers.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                {refFilter !== 'all' && <span className="text-xs text-zinc-500">{shownLeads.length} shown</span>}
              </div>
            )}

            <Card className="bg-zinc-900/60 border-zinc-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-950/80 text-zinc-500 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="text-left px-4 py-3">Restaurant</th>
                      <th className="text-left px-4 py-3">Owner</th>
                      <th className="text-left px-4 py-3">Referred by</th>
                      <th className="text-left px-4 py-3">Photos</th>
                      <th className="text-left px-4 py-3">Status</th>
                      <th className="text-left px-4 py-3">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shownLeads.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-12 text-center text-zinc-500">No leads yet. Go close some! 🔥</td></tr>
                    )}
                    {shownLeads.map((l) => (
                      <tr key={l.id} onClick={() => setSelected(l)}
                        className="border-t border-zinc-800 hover:bg-white/[0.03] cursor-pointer">
                        <td className="px-4 py-3 font-medium">{l.restaurantName}</td>
                        <td className="px-4 py-3 text-zinc-300">{l.ownerName}</td>
                        <td className="px-4 py-3">
                          {l.affiliateName ? (
                            <span className="inline-flex items-center gap-1.5 text-orange-300"><UserPlus size={12} /> {l.affiliateName}</span>
                          ) : <span className="text-zinc-600">Direct</span>}
                        </td>
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
        )}
        {tab === 'leadbank' && <LeadBankTab adminKey={key} />}
        {tab === 'media' && <MediaManagement adminKey={key} />}
        {tab === 'affiliates' && <AffiliatesManagement adminKey={key} />}
      </div>

      {selected && (
        <LeadDetail
          lead={selected}
          adminKey={key}
          onClose={() => setSelected(null)}
          onStatus={(s) => updateStatus(selected, s)}
          onGenerate={() => generateVideo(selected)}
          onPatched={(patch) => patchLeadLocal(selected.id, patch)}
        />
      )}

      {showAdd && (
        <AddLeadModal
          affCodes={affCodes}
          onClose={() => setShowAdd(false)}
          onCreate={addLead}
          onCreated={(lead) => { setShowAdd(false); if (lead) setSelected(lead) }}
        />
      )}
    </main>
  )
}

const LeadDetail = ({ lead, adminKey, onClose, onStatus, onGenerate, onPatched }) => {
  const digits = (lead.phone || '').replace(/[^\d]/g, '')
  const ig = (lead.instagram || '').replace(/^@/, '')
  const dishRef = useRef(null)
  const menuRef = useRef(null)
  const [uploadingDish, setUploadingDish] = useState(false)
  const [uploadingMenu, setUploadingMenu] = useState(false)
  const [locName, setLocName] = useState('')
  const [locArea, setLocArea] = useState('')

  const copy = (txt) => navigator.clipboard.writeText(txt).then(
    () => toast.success('Copied'), () => toast.error('Could not copy'))

  const sendEmail = () => {
    if (!lead.email) return
    const subject = `FoodLens — your video menu`
    const body = `Hi ${lead.ownerName || 'there'},\n\nFollowing up on FoodLens for ${lead.restaurantName || 'your restaurant'} — happy to get your video menu set up whenever suits.\n\nBest,\nDiego`
    window.location.href = `mailto:${encodeURIComponent(lead.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  const uploadDish = async (files) => {
    const list = Array.from(files || [])
    if (!list.length) return
    setUploadingDish(true)
    try {
      const added = []
      for (const f of list) { const p = await uploadLeadFile(lead.id, f); if (p) added.push(p) }
      if (added.length) onPatched({ photos: [...(lead.photos || []), ...added], status: 'photos_uploaded' })
      toast.success(`${added.length} added`)
    } catch (e) { toast.error(e.message) } finally { setUploadingDish(false) }
  }

  const uploadMenu = async (files) => {
    const list = Array.from(files || [])
    if (!list.length) return
    setUploadingMenu(true)
    try {
      const added = []
      for (const f of list) { const p = await uploadLeadMenuFile(lead.id, f); if (p) added.push(p) }
      if (added.length) onPatched({ menuPhotos: [...(lead.menuPhotos || []), ...added] })
      toast.success(`${added.length} menu file(s) added`)
    } catch (e) { toast.error(e.message) } finally { setUploadingMenu(false) }
  }

  const saveLocations = async (next) => {
    onPatched({ locations: next })
    try {
      await fetch(`/api/leads/${lead.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey },
        body: JSON.stringify({ locations: next }),
      })
    } catch (e) { toast.error('Could not save locations') }
  }
  const addLocation = () => {
    if (!locName.trim() && !locArea.trim()) return
    saveLocations([...(lead.locations || []), { name: locName.trim(), area: locArea.trim() }])
    setLocName(''); setLocArea('')
  }
  const removeLocation = (i) => saveLocations((lead.locations || []).filter((_, idx) => idx !== i))

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-zinc-950 border-l border-zinc-800 h-full overflow-y-auto">
        <div className="sticky top-0 glass px-5 py-4 flex items-center justify-between border-b border-zinc-800">
          <div>
            <div className="text-lg font-bold leading-tight">{lead.restaurantName}</div>
            <div className="text-xs text-zinc-500">{lead.ownerName}{lead.affiliateName ? ` · via ${lead.affiliateName}` : ''}</div>
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

          {/* Contact + Send email */}
          <div>
            <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Contact</div>
            <div className="space-y-2">
              <ContactRow icon={Mail} label={lead.email || '—'}
                actions={lead.email && [
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
            {lead.email && (
              <Button size="sm" onClick={sendEmail} className="mt-2 bg-orange-500 hover:bg-orange-600 text-white">
                <Mail size={14} className="mr-1.5" /> Send email
              </Button>
            )}
          </div>

          {/* Locations */}
          <div>
            <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Locations · one account = one venue</div>
            {(lead.locations || []).length > 0 && (
              <ul className="space-y-1.5 mb-2">
                {(lead.locations || []).map((loc, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 text-sm bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2">
                    <span className="inline-flex items-center gap-1.5 min-w-0"><MapPin size={12} className="text-zinc-500 flex-shrink-0" /> <span className="truncate">{loc.name}{loc.area ? ` — ${loc.area}` : ''}</span></span>
                    <button onClick={() => removeLocation(i)} className="text-zinc-600 hover:text-red-400 flex-shrink-0"><Trash2 size={13} /></button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2">
              <Input value={locName} onChange={(e) => setLocName(e.target.value)} placeholder="Name" className="bg-zinc-900 border-zinc-800 h-8 text-xs" />
              <Input value={locArea} onChange={(e) => setLocArea(e.target.value)} placeholder="Area" className="bg-zinc-900 border-zinc-800 h-8 text-xs" />
              <Button size="sm" variant="outline" onClick={addLocation} className="border-zinc-700 h-8"><Plus size={13} /></Button>
            </div>
          </div>

          {/* Dish photos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs uppercase tracking-wider text-zinc-500">Dish photos ({(lead.photos || []).length})</div>
              <input ref={dishRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => uploadDish(e.target.files)} />
              <button onClick={() => dishRef.current?.click()} disabled={uploadingDish} className="text-xs text-orange-400 hover:text-orange-300 inline-flex items-center gap-1"><Upload size={12} /> {uploadingDish ? 'Uploading…' : 'Add'}</button>
            </div>
            {(lead.photos || []).length === 0 ? (
              <p className="text-sm text-zinc-600">No dish photos yet.</p>
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

          {/* Menu photos (image or PDF) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs uppercase tracking-wider text-zinc-500">Menu photos ({(lead.menuPhotos || []).length})</div>
              <input ref={menuRef} type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={(e) => uploadMenu(e.target.files)} />
              <button onClick={() => menuRef.current?.click()} disabled={uploadingMenu} className="text-xs text-orange-400 hover:text-orange-300 inline-flex items-center gap-1"><Upload size={12} /> {uploadingMenu ? 'Uploading…' : 'Add'}</button>
            </div>
            {(lead.menuPhotos || []).length === 0 ? (
              <p className="text-sm text-zinc-600">No menu yet — image or PDF.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {(lead.menuPhotos || []).map((p, i) => (
                  <a key={i} href={p.url || '#'} target="_blank" rel="noreferrer"
                    className="relative aspect-square rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-orange-500 flex items-center justify-center">
                    {p.url && /^image\//.test(p.contentType || '') ? (
                      <img src={p.url} alt={p.name || 'menu'} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-zinc-400 flex flex-col items-center gap-1 text-[10px]"><FileText size={18} /> PDF</span>
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

          {lead.note && (
            <div>
              <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Notes</div>
              <p className="text-sm text-zinc-300 whitespace-pre-wrap">{lead.note}</p>
            </div>
          )}

          <div className="text-xs text-zinc-600 border-t border-zinc-800 pt-4">
            Lead ID: {lead.id}<br />
            Source: {lead.source || '—'}{lead.affiliateCode ? ` · code ${lead.affiliateCode}` : ''}<br />
            Created: {new Date(lead.createdAt).toLocaleString()}
            {lead.updatedAt && <><br />Updated: {new Date(lead.updatedAt).toLocaleString()}</>}
          </div>
        </div>
      </div>
    </div>
  )
}

const AddLeadModal = ({ affCodes, onClose, onCreate, onCreated }) => {
  const [form, setForm] = useState({ restaurantName: '', ownerName: '', email: '', phone: '', instagram: '', note: '', status: 'new', affiliateCode: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    try { const c = localStorage.getItem('fl_admin_lead_code') || ''; if (c) setForm((f) => ({ ...f, affiliateCode: c })) } catch (e) {}
  }, [])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.restaurantName.trim() || !form.ownerName.trim()) { toast.error('Restaurant and owner are required'); return }
    setSaving(true)
    try {
      const code = form.affiliateCode.trim().toUpperCase()
      const lead = await onCreate({ ...form, affiliateCode: code })
      try { if (code) localStorage.setItem('fl_admin_lead_code', code) } catch (er) {}
      toast.success('Lead added')
      onCreated(lead)
    } catch (err) { toast.error(err.message) } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <Card className="relative bg-zinc-950 border-zinc-800 w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Add lead</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-zinc-300 text-xs mb-1 block">Restaurant *</Label><Input value={form.restaurantName} onChange={set('restaurantName')} className="bg-zinc-900 border-zinc-800" /></div>
            <div><Label className="text-zinc-300 text-xs mb-1 block">Owner *</Label><Input value={form.ownerName} onChange={set('ownerName')} className="bg-zinc-900 border-zinc-800" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-zinc-300 text-xs mb-1 block">Email</Label><Input type="email" value={form.email} onChange={set('email')} className="bg-zinc-900 border-zinc-800" /></div>
            <div><Label className="text-zinc-300 text-xs mb-1 block">Phone</Label><Input value={form.phone} onChange={set('phone')} className="bg-zinc-900 border-zinc-800" /></div>
          </div>
          <div><Label className="text-zinc-300 text-xs mb-1 block">Instagram</Label><Input value={form.instagram} onChange={set('instagram')} placeholder="@handle" className="bg-zinc-900 border-zinc-800" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-zinc-300 text-xs mb-1 block">Status</Label>
              <select value={form.status} onChange={set('status')} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg text-sm px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-orange-500">
                {PIPELINE.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-zinc-300 text-xs mb-1 block">Referred by (code)</Label>
              <Input list="fl-aff-codes" value={form.affiliateCode} onChange={set('affiliateCode')} placeholder="FL-…" className="bg-zinc-900 border-zinc-800 font-mono" />
              <datalist id="fl-aff-codes">{(affCodes || []).map((c) => <option key={c} value={c} />)}</datalist>
            </div>
          </div>
          <div><Label className="text-zinc-300 text-xs mb-1 block">Notes</Label><Textarea value={form.note} onChange={set('note')} rows={2} className="bg-zinc-900 border-zinc-800 resize-none" /></div>
          <p className="text-[11px] text-zinc-600">No photos needed now — add dish/menu photos later from the lead. Credited to the code above (defaults to your last-used).</p>
          <Button type="submit" disabled={saving} className="w-full bg-orange-500 hover:bg-orange-600 text-white">{saving ? 'Adding…' : 'Add lead'}</Button>
        </form>
      </Card>
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
  const [deck, setDeck] = useState(DEFAULT_DECK)
  const fileRefs = useRef({})
  const deckFileRef = useRef(null)

  useEffect(() => {
    fetch('/api/settings/media').then((r) => r.json()).then((d) => {
      if (Array.isArray(d?.dishes) && d.dishes.length) setDishes(d.dishes)
      if (d?.deck) setDeck(d.deck)
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
      const fileUrl = await uploadMediaFile(file, adminKey)
      update(i, 'video', fileUrl)
      toast.success('Clip uploaded. Click Save to publish.')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setUploadingIdx(null)
    }
  }

  const updateDeck = (field, value) => setDeck((dk) => ({ ...dk, [field]: value }))

  const uploadDeckClip = async (file) => {
    if (!file) return
    setUploadingIdx('deck')
    try {
      const fileUrl = await uploadMediaFile(file, adminKey)
      updateDeck('video', fileUrl)
      toast.success('Deck clip uploaded. Click Save to publish.')
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
        body: JSON.stringify({ dishes, deck }),
      })
      if (!res.ok) throw new Error('Save failed')
      toast.success('Saved and published. The live menu now uses these.')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const reset = () => { setDishes(DEFAULT_DISHES); setDeck(DEFAULT_DECK); toast.info('Reset to defaults. Click Save to persist.') }

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

      <Card className="bg-zinc-900/60 border-orange-500/30 p-5 mb-4">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Clapperboard size={16} className="text-orange-400" />
          <h2 className="text-lg font-bold">Showcase deck — Solution slide</h2>
          <span className="text-xs text-zinc-500">its own video, separate from the menu dishes</span>
        </div>
        <div className="flex items-start gap-4">
          <div className="relative w-24 h-32 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 flex-shrink-0">
            {deck.video ? (
              <video src={deck.video} poster={deck.poster} muted loop playsInline className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-700"><Play size={20} /></div>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <Input value={deck.name} onChange={(e) => updateDeck('name', e.target.value)} placeholder="Dish name" className="col-span-2 bg-zinc-950 border-zinc-800 h-9 text-sm" />
              <Input value={deck.price} onChange={(e) => updateDeck('price', e.target.value)} placeholder="€24" className="bg-zinc-950 border-zinc-800 h-9 text-sm" />
            </div>
            <Input value={deck.tag} onChange={(e) => updateDeck('tag', e.target.value)} placeholder="Chef's Pick" className="bg-zinc-950 border-zinc-800 h-9 text-sm" />
            <Input value={deck.video} onChange={(e) => updateDeck('video', e.target.value)} placeholder="https://...video.mp4" className="bg-zinc-950 border-zinc-800 h-9 text-xs font-mono" />
            <div className="flex items-center gap-2">
              <input ref={deckFileRef} type="file" accept="video/*,image/*" className="hidden" onChange={(e) => uploadDeckClip(e.target.files?.[0])} />
              <Button size="sm" variant="outline" disabled={uploadingIdx === 'deck'} onClick={() => deckFileRef.current?.click()} className="border-zinc-800 text-xs">
                <Upload size={12} className="mr-1.5" /> {uploadingIdx === 'deck' ? 'Uploading…' : 'Upload clip'}
              </Button>
              <Input value={deck.poster} onChange={(e) => updateDeck('poster', e.target.value)} placeholder="Poster URL (optional)" className="bg-zinc-950 border-zinc-800 h-9 text-xs font-mono flex-1" />
            </div>
          </div>
        </div>
      </Card>

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

const AFF_STATUS = {
  pending: 'border-amber-500/50 text-amber-300',
  approved: 'border-green-500/50 text-green-300',
  paused: 'border-zinc-500/50 text-zinc-300',
  rejected: 'border-red-500/50 text-red-300',
}
const AFF_LABEL = { pending: 'Pending', approved: 'Approved', paused: 'Paused', rejected: 'Rejected' }

const AffAvatar = ({ a, size = 44 }) =>
  a?.avatarUrl ? (
    <img src={a.avatarUrl} alt={a.name || 'avatar'} className="rounded-full object-cover border border-zinc-700 flex-shrink-0" style={{ width: size, height: size }} />
  ) : (
    <div className="rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 font-semibold flex-shrink-0" style={{ width: size, height: size }}>
      {(a?.name || '?').trim().charAt(0).toUpperCase()}
    </div>
  )

const AffiliatesManagement = ({ adminKey }) => {
  const [affiliates, setAffiliates] = useState([])
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [notes, setNotes] = useState({})
  const [selectedAff, setSelectedAff] = useState(null)
  const [detailLeads, setDetailLeads] = useState([])
  const [detailLoading, setDetailLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/affiliates', { headers: { 'X-Admin-Key': adminKey } })
      const data = await res.json()
      const list = data.affiliates || []
      setAffiliates(list)
      setNotes(Object.fromEntries(list.map((a) => [a.id, a.adminNotes || ''])))
    } catch (e) {
      toast.error('Failed to load affiliates')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const patch = async (a, body) => {
    setBusyId(a.id)
    try {
      const res = await fetch(`/api/affiliates/${a.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Update failed')
      setAffiliates((arr) => arr.map((x) => (x.id === a.id ? { ...x, ...data.affiliate } : x)))
      return data.affiliate
    } catch (e) {
      toast.error(e.message)
      return null
    } finally {
      setBusyId(null)
    }
  }

  const approve = async (a) => {
    const updated = await patch(a, { status: 'approved' })
    if (updated) toast.success(updated.code ? `Approved — code ${updated.code} emailed to ${a.email}` : 'Resumed')
  }
  const pause = async (a) => { const u = await patch(a, { status: 'paused' }); if (u) toast.success('Paused') }
  const reject = async (a) => {
    if (!window.confirm(`Reject ${a.name}? Their code (if any) stops working.`)) return
    const u = await patch(a, { status: 'rejected' }); if (u) toast.success('Rejected')
  }
  const saveNotes = async (a) => {
    if ((notes[a.id] || '') === (a.adminNotes || '')) return
    const u = await patch(a, { adminNotes: notes[a.id] || '' }); if (u) toast.success('Notes saved')
  }
  const sendLink = async (a) => {
    if (!a.code) { toast.error('Approve first to generate a code'); return }
    setBusyId(a.id)
    try {
      const res = await fetch(`/api/affiliates/${a.id}/send-link`, { method: 'POST', headers: { 'X-Admin-Key': adminKey } })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to send')
      toast.success(`Dashboard link emailed to ${a.email}`)
    } catch (e) { toast.error(e.message) } finally { setBusyId(null) }
  }
  const openDetail = async (a) => {
    setSelectedAff(a)
    setDetailLeads([])
    if (a.code) {
      setDetailLoading(true)
      try {
        const res = await fetch(`/api/leads?affiliateCode=${encodeURIComponent(a.code)}`, { headers: { 'X-Admin-Key': adminKey } })
        const data = await res.json().catch(() => ({}))
        setDetailLeads(data.leads || [])
      } catch (e) { /* ignore */ } finally { setDetailLoading(false) }
    }
  }

  const copy = (txt) => navigator.clipboard.writeText(txt).then(
    () => toast.success('Copied'), () => toast.error('Could not copy'))

  const counts = {
    pending: affiliates.filter((a) => a.status === 'pending').length,
    approved: affiliates.filter((a) => a.status === 'approved').length,
    paused: affiliates.filter((a) => a.status === 'paused').length,
    rejected: affiliates.filter((a) => a.status === 'rejected').length,
  }
  const shown = affiliates.filter((a) => statusFilter === 'all' || a.status === statusFilter)
  const detail = selectedAff ? affiliates.find((x) => x.id === selectedAff.id) || selectedAff : null

  return (
    <div className="rounded-2xl" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '22px 22px' }}>
      <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <UserPlus size={18} className="text-orange-400" />
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Affiliates</h1>
          </div>
          <p className="text-zinc-500 text-sm md:text-base">Review applicants, approve to generate their code + send the kit.</p>
        </div>
        <Button size="sm" variant="outline" onClick={load} className="border-zinc-800">
          <RefreshCw size={13} className={`mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Clock} label="Pending" value={counts.pending} />
        <StatCard icon={Check} label="Approved" value={counts.approved} />
        <StatCard icon={Pause} label="Paused" value={counts.paused} />
        <StatCard icon={Ban} label="Rejected" value={counts.rejected} />
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {['all', 'pending', 'approved', 'paused', 'rejected'].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-full border ${statusFilter === s ? 'bg-orange-500 border-orange-500 text-white' : 'border-zinc-700 text-zinc-400 hover:border-orange-500/60'}`}>
            {s === 'all' ? 'All' : AFF_LABEL[s]}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <Card className="bg-zinc-900/60 border-zinc-800 p-12 text-center text-zinc-500">
          {loading ? 'Loading…' : 'No applications here yet.'}
        </Card>
      ) : (
        <div className="space-y-3">
          {shown.map((a) => (
            <Card key={a.id} onClick={() => openDetail(a)}
              className="bg-zinc-900/60 border-zinc-800 p-4 cursor-pointer hover:border-orange-500/40 transition">
              <div className="flex items-center gap-4">
                <AffAvatar a={a} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold truncate">{a.name}</span>
                    <Badge variant="outline" className={AFF_STATUS[a.status] || AFF_STATUS.pending}>{AFF_LABEL[a.status] || a.status}</Badge>
                    {a.code && <span className="text-xs font-mono text-orange-300">{a.code}</span>}
                  </div>
                  <div className="text-sm text-zinc-400 truncate">{a.email}</div>
                  <div className="text-xs text-zinc-500 mt-0.5 flex items-center gap-3 flex-wrap">
                    {a.code && <span>{a.leadCount || 0} lead{(a.leadCount || 0) === 1 ? '' : 's'}</span>}
                    {a.referredByName && <span className="inline-flex items-center gap-1"><UserPlus size={11} /> via {a.referredByName}</span>}
                    {a.status === 'pending' && <span className="text-amber-400/80">Needs review</span>}
                  </div>
                </div>
                <ChevronRight size={18} className="text-zinc-600 flex-shrink-0" />
              </div>
              <div className="flex flex-wrap gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                {a.status !== 'approved' && (
                  <Button size="sm" disabled={busyId === a.id} onClick={() => approve(a)} className="bg-orange-500 hover:bg-orange-600 text-white">
                    <Check size={13} className="mr-1.5" /> {a.status === 'paused' || a.status === 'rejected' ? 'Resume' : 'Approve'}
                  </Button>
                )}
                {a.code && (
                  <>
                    <Button size="sm" variant="outline" disabled={busyId === a.id} onClick={() => sendLink(a)} className="border-zinc-700"><Send size={13} className="mr-1.5" /> Send link</Button>
                    <Button size="sm" variant="outline" onClick={() => copy(a.code)} className="border-zinc-700"><Copy size={13} className="mr-1.5" /> Copy code</Button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedAff(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-zinc-950 border-l border-zinc-800 h-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 glass px-5 py-4 flex items-center justify-between border-b border-zinc-800">
              <div className="flex items-center gap-3 min-w-0">
                <AffAvatar a={detail} size={40} />
                <div className="min-w-0">
                  <div className="font-bold leading-tight truncate">{detail.name}</div>
                  <Badge variant="outline" className={AFF_STATUS[detail.status] || AFF_STATUS.pending}>{AFF_LABEL[detail.status] || detail.status}</Badge>
                </div>
              </div>
              <button onClick={() => setSelectedAff(null)} className="p-2 rounded-lg hover:bg-white/5"><X size={18} /></button>
            </div>

            <div className="p-5 space-y-6">
              <div>
                <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Engagement</div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2.5">
                    <div className="text-lg font-bold">{detail.checklistDone ?? 0}/{detail.checklistTotal ?? 0}</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wide">Quick-start</div>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2.5">
                    <div className="text-lg font-bold">{detail.workbookCount ?? 0}</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wide">Targets</div>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2.5">
                    <div className="text-lg font-bold">{detail.signedCount ?? 0}</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wide">Won</div>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 mt-2">Rank <span className="text-orange-300">{detail.rank || 'Promoter'}</span> · {detail.workbookSigned ?? 0} marked signed in workbook</p>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Quick actions</div>
                <div className="flex flex-wrap gap-2">
                  {detail.status !== 'approved' && (
                    <Button size="sm" disabled={busyId === detail.id} onClick={() => approve(detail)} className="bg-orange-500 hover:bg-orange-600 text-white">
                      <Check size={13} className="mr-1.5" /> {detail.status === 'paused' || detail.status === 'rejected' ? 'Resume' : 'Approve'}
                    </Button>
                  )}
                  {detail.status === 'approved' && (
                    <Button size="sm" variant="outline" disabled={busyId === detail.id} onClick={() => pause(detail)} className="border-zinc-700"><Pause size={13} className="mr-1.5" /> Pause</Button>
                  )}
                  {detail.status !== 'rejected' && (
                    <Button size="sm" variant="outline" disabled={busyId === detail.id} onClick={() => reject(detail)} className="border-red-500/40 text-red-300 hover:bg-red-500/10"><Ban size={13} className="mr-1.5" /> Reject</Button>
                  )}
                </div>
              </div>

              {detail.code && (
                <div>
                  <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Affiliate code</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="flex-1 min-w-[8rem] text-sm font-mono text-orange-300 bg-zinc-900 border border-dashed border-orange-500/50 rounded-lg px-3 py-2">{detail.code}</code>
                    <Button size="sm" variant="outline" onClick={() => copy(detail.code)} className="border-zinc-700"><Copy size={13} /></Button>
                    <Button size="sm" disabled={busyId === detail.id} onClick={() => sendLink(detail)} className="bg-orange-500 hover:bg-orange-600 text-white"><Send size={13} className="mr-1.5" /> Send link</Button>
                  </div>
                  <p className="text-xs text-zinc-600 mt-1.5">{detail.trainingAckAt ? '✓ Training acknowledged' : 'Training not yet acknowledged'}</p>
                </div>
              )}

              <div>
                <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Contact</div>
                <div className="space-y-1.5 text-sm text-zinc-300">
                  <a href={`mailto:${detail.email}`} className="flex items-center gap-2 hover:text-orange-400"><Mail size={13} /> {detail.email}</a>
                  {detail.phone && <div className="flex items-center gap-2"><Phone size={13} /> {detail.phone}</div>}
                  {detail.social && <div className="flex items-center gap-2"><Instagram size={13} /> {detail.social}</div>}
                  {detail.referredByName && <div className="flex items-center gap-2 text-zinc-500"><UserPlus size={13} /> Referred by {detail.referredByName}</div>}
                </div>
              </div>

              {detail.audience && (
                <div>
                  <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Audience / note</div>
                  <p className="text-sm text-zinc-400">{detail.audience}</p>
                </div>
              )}

              <div>
                <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Admin notes</div>
                <Input value={notes[detail.id] ?? ''} onChange={(e) => setNotes((n) => ({ ...n, [detail.id]: e.target.value }))}
                  onBlur={() => saveNotes(detail)} placeholder="e.g. schedule a 101…" className="bg-zinc-900 border-zinc-800 h-9 text-sm" />
              </div>

              <div>
                <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Referred leads ({detail.code ? (detailLeads.length || detail.leadCount || 0) : 0})</div>
                {!detail.code ? (
                  <p className="text-sm text-zinc-600">No code yet — approve to start tracking.</p>
                ) : detailLoading ? (
                  <p className="text-sm text-zinc-600">Loading…</p>
                ) : detailLeads.length === 0 ? (
                  <p className="text-sm text-zinc-600">No referred leads yet.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {detailLeads.map((l) => (
                      <li key={l.id} className="flex items-center justify-between gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm">
                        <span className="truncate"><span className="font-medium">{l.restaurantName}</span> <span className="text-zinc-500">· {l.ownerName}</span></span>
                        <StatusBadge status={l.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="text-xs text-zinc-600 border-t border-zinc-800 pt-4">
                Applied: {detail.createdAt ? new Date(detail.createdAt).toLocaleString() : '—'}
                {detail.approvedAt && <><br />Approved: {new Date(detail.approvedAt).toLocaleString()}</>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

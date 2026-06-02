'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Lock, Clapperboard, RefreshCw, Users, Calendar, Instagram, Phone, Mail, ArrowLeft, Film, Save, RotateCcw, ExternalLink, Play } from 'lucide-react'
import { toast } from 'sonner'
import { DEFAULT_DISHES } from '@/lib/foodlens-data'
import { Logo } from '@/components/logo'

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [key, setKey] = useState('')
  const [leads, setLeads] = useState([])
  const [todayOnly, setTodayOnly] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('fl_admin_key') : null
    if (saved) {
      setKey(saved)
      tryLogin(saved)
    }
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
    setLoading(true)
    try {
      const res = await fetch(`/api/leads?today=${today ? 1 : 0}`, {
        headers: { 'X-Admin-Key': k },
      })
      const data = await res.json()
      setLeads(data.leads || [])
    } catch (e) {
      toast.error('Failed to load leads')
    } finally {
      setLoading(false)
    }
  }

  if (!authed) {
    return (
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <Card className="bg-zinc-900 border-zinc-800 p-8 max-w-sm w-full">
          <div className="flex justify-center mb-5">
            <Logo size="lg" />
          </div>
          <h1 className="text-xl font-bold text-center mb-1">Admin Access</h1>
          <p className="text-sm text-zinc-500 text-center mb-6 flex items-center justify-center gap-1.5"><Lock size={12} /> Enter your team key</p>
          <form onSubmit={(e) => { e.preventDefault(); tryLogin(key) }} className="space-y-3">
            <Input
              type="password"
              placeholder="Admin key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="bg-zinc-950 border-zinc-800 focus-visible:ring-orange-500"
              autoFocus
            />
            <Button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
              {loading ? 'Checking…' : 'Unlock'}
            </Button>
          </form>
          <Link href="/" className="mt-5 block text-center text-xs text-zinc-500 hover:text-orange-400">
            ← Back to app
          </Link>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <nav className="glass sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="p-1.5 rounded hover:bg-white/5"><ArrowLeft size={16} /></Link>
            <Logo size="sm" />
            <Badge variant="outline" className="ml-1 border-orange-500/40 text-orange-400 text-[10px]">ADMIN</Badge>
          </div>
          <Button size="sm" variant="outline" onClick={() => loadLeads()} className="border-zinc-800">
            <RefreshCw size={13} className={`mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Today’s Leads</h1>
            <p className="text-zinc-500 mt-1">All restaurants signed up from the field.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={todayOnly ? 'default' : 'outline'}
              onClick={() => { setTodayOnly(true); loadLeads(key, true) }}
              className={todayOnly ? 'bg-orange-500 hover:bg-orange-600' : 'border-zinc-800'}
            >Today</Button>
            <Button
              size="sm"
              variant={!todayOnly ? 'default' : 'outline'}
              onClick={() => { setTodayOnly(false); loadLeads(key, false) }}
              className={!todayOnly ? 'bg-orange-500 hover:bg-orange-600' : 'border-zinc-800'}
            >All Time</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard icon={Users} label="Total Leads" value={leads.length} />
          <StatCard icon={Calendar} label={todayOnly ? 'Today' : 'All Time'} value={leads.length} />
          <StatCard icon={Instagram} label="With IG" value={leads.filter((l) => l.instagram).length} />
          <StatCard icon={Phone} label="With Phone" value={leads.filter((l) => l.phone).length} />
        </div>

        <Card className="bg-zinc-900/60 border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-950/80 text-zinc-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3">Restaurant</th>
                  <th className="text-left px-4 py-3">Owner</th>
                  <th className="text-left px-4 py-3">Instagram</th>
                  <th className="text-left px-4 py-3">Phone</th>
                  <th className="text-left px-4 py-3">Photos</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-zinc-500">No leads yet. Go close some! 🔥</td></tr>
                )}
                {leads.map((l) => (
                  <tr key={l.id} className="border-t border-zinc-800 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium">{l.restaurantName}</td>
                    <td className="px-4 py-3 text-zinc-300">{l.ownerName}</td>
                    <td className="px-4 py-3">
                      {l.instagram ? <a href={`https://instagram.com/${l.instagram.replace('@','')}`} target="_blank" rel="noreferrer" className="text-orange-400 hover:underline">{l.instagram}</a> : <span className="text-zinc-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{l.phone || <span className="text-zinc-600">—</span>}</td>
                    <td className="px-4 py-3">
                      {(l.photos || []).length === 0 ? (
                        <span className="text-zinc-600">—</span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          {(l.photos || []).slice(0, 4).map((p, i) =>
                            p.url && /^image\//.test(p.contentType || '') ? (
                              <a key={i} href={p.url} target="_blank" rel="noreferrer">
                                <img src={p.url} alt={p.name || 'photo'} className="w-9 h-9 rounded object-cover border border-zinc-700 hover:border-orange-500" />
                              </a>
                            ) : (
                              <a key={i} href={p.url || '#'} target="_blank" rel="noreferrer" className="w-9 h-9 rounded border border-zinc-700 hover:border-orange-500 flex items-center justify-center text-zinc-400">
                                <Film size={14} />
                              </a>
                            ),
                          )}
                          {(l.photos || []).length > 4 && (
                            <span className="text-xs text-zinc-500">+{(l.photos || []).length - 4}</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={l.status} />
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">
                      {new Date(l.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <MediaManagement adminKey={key} />
      </div>
    </main>
  )
}

const MediaManagement = ({ adminKey }) => {
  const [dishes, setDishes] = useState(DEFAULT_DISHES)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/settings/media').then((r) => r.json()).then((d) => {
      if (Array.isArray(d?.dishes) && d.dishes.length) setDishes(d.dishes)
      setLoaded(true)
    }).catch(() => setLoaded(true))
  }, [])

  const update = (i, field, value) => {
    setDishes((arr) => arr.map((d, idx) => idx === i ? { ...d, [field]: value } : d))
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
      toast.success('Saved. The demo updates instantly on next page load.')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const reset = () => {
    setDishes(DEFAULT_DISHES)
    toast.info('Reset to defaults. Click Save to persist.')
  }

  return (
    <div className="mt-10">
      <div className="flex items-end justify-between mb-5 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Film size={18} className="text-orange-400" />
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Media Management</h2>
          </div>
          <p className="text-zinc-500 text-sm md:text-base">Paste mp4/webm URLs to replace demo videos. Free sources: <a href="https://www.pexels.com/videos/" target="_blank" rel="noreferrer" className="text-orange-400 hover:underline">pexels.com/videos <ExternalLink size={11} className="inline" /></a>, <a href="https://mixkit.co/free-stock-video/food/" target="_blank" rel="noreferrer" className="text-orange-400 hover:underline">mixkit.co/food <ExternalLink size={11} className="inline" /></a>, <a href="https://www.coverr.co/categories/food" target="_blank" rel="noreferrer" className="text-orange-400 hover:underline">coverr.co/food <ExternalLink size={11} className="inline" /></a>.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={reset} className="border-zinc-800"><RotateCcw size={13} className="mr-1.5" /> Reset</Button>
          <Button size="sm" onClick={save} disabled={saving || !loaded} className="bg-orange-500 hover:bg-orange-600 text-white">
            <Save size={13} className="mr-1.5" /> {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {dishes.map((d, i) => (
          <Card key={d.id} className="bg-zinc-900/60 border-zinc-800 p-5">
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
                <Input value={d.poster} onChange={(e) => update(i, 'poster', e.target.value)} placeholder="Poster image URL (optional)" className="bg-zinc-950 border-zinc-800 h-9 text-xs font-mono" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
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

const STATUS_STYLES = {
  new: 'border-zinc-600 text-zinc-300',
  photos_uploaded: 'border-orange-500/50 text-orange-300',
  video_generating: 'border-blue-500/50 text-blue-300',
  video_sent: 'border-green-500/50 text-green-300',
}

const STATUS_LABELS = {
  new: 'New',
  photos_uploaded: 'Photos in',
  video_generating: 'Video queued',
  video_sent: 'Video sent',
}

const StatusBadge = ({ status }) => {
  const s = status || 'new'
  return (
    <Badge variant="outline" className={STATUS_STYLES[s] || STATUS_STYLES.new}>
      {STATUS_LABELS[s] || s}
    </Badge>
  )
}

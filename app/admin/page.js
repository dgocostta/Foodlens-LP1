'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Lock, Clapperboard, RefreshCw, Users, Calendar, Instagram, Phone, Mail, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

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
            <div className="w-12 h-12 rounded-2xl bg-orange-500/15 flex items-center justify-center">
              <Lock size={20} className="text-orange-400" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-center mb-1">Admin Access</h1>
          <p className="text-sm text-zinc-500 text-center mb-6">Enter your team key</p>
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
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
              <Clapperboard size={14} className="text-white" />
            </div>
            <span className="font-bold text-sm">FoodLens</span>
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
                  <th className="text-left px-4 py-3">Dishes</th>
                  <th className="text-left px-4 py-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-zinc-500">No leads yet. Go close some! 🔥</td></tr>
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
                      <Badge variant="outline" className="border-zinc-700 text-zinc-300">{(l.dishes || []).length}/5</Badge>
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
      </div>
    </main>
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

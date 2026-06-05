'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Store, User, Instagram, Phone, Mail, Camera, Upload, ArrowRight, Check,
  Tag, KeyRound, BookOpen, LogOut, Plus, CheckCircle2,
} from 'lucide-react'
import { Logo } from '@/components/logo'
import { uploadLeadFile } from '@/lib/upload'

const GRID_BG = {
  backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
  backgroundSize: '22px 22px',
}
const EMPTY = { restaurantName: '', ownerName: '', instagram: '', phone: '', email: '' }

export default function FieldPage() {
  const [phase, setPhase] = useState('gate') // 'gate' | 'ready'
  const [codeInput, setCodeInput] = useState('')
  const [checking, setChecking] = useState(false)
  const [affiliate, setAffiliate] = useState({ code: '', name: '' })

  const [form, setForm] = useState(EMPTY)
  const [dishes, setDishes] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [sessionLeads, setSessionLeads] = useState([])
  const fileRef = useRef(null)

  // Pick up a code from the URL (?code=) or localStorage and validate it.
  useEffect(() => {
    let initial = ''
    try {
      const url = new URLSearchParams(window.location.search).get('code')
      initial = url || localStorage.getItem('fl_affiliate_code') || ''
    } catch (e) {}
    if (initial) { setCodeInput(initial); validateCode(initial, true) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const validateCode = async (raw, silent = false) => {
    const code = String(raw || '').trim().toUpperCase()
    if (!code) { toast.error('Enter your affiliate code'); return }
    setChecking(true)
    try {
      const res = await fetch(`/api/affiliates/validate?code=${encodeURIComponent(code)}`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.valid) throw new Error('That code isn’t valid or active')
      setAffiliate({ code: data.code || code, name: data.name || '' })
      setPhase('ready')
      try { localStorage.setItem('fl_affiliate_code', data.code || code) } catch (e) {}
    } catch (err) {
      if (!silent) toast.error(err.message)
      try { localStorage.removeItem('fl_affiliate_code') } catch (e) {}
    } finally {
      setChecking(false)
    }
  }

  const signOut = () => {
    try { localStorage.removeItem('fl_affiliate_code') } catch (e) {}
    setAffiliate({ code: '', name: '' })
    setPhase('gate')
    setForm(EMPTY)
    setDishes([])
    setSessionLeads([])
  }

  const handleDishUpload = (e) => {
    const files = Array.from(e.target.files || [])
    const next = files.slice(0, 5 - dishes.length).map((f) => ({
      name: f.name, preview: URL.createObjectURL(f), size: f.size, file: f,
    }))
    setDishes((arr) => [...arr, ...next])
    if (next.length) toast.success(`${next.length} added`)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.restaurantName || !form.ownerName) {
      toast.error('Restaurant name and owner/manager are required')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          dishes: dishes.map((d) => ({ name: d.name, size: d.size })),
          affiliateCode: affiliate.code,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to save lead')
      const newId = data.lead?.id || ''
      dishes.forEach((d) => { if (d.file) uploadLeadFile(newId, d.file).catch(() => {}) })
      setSessionLeads((arr) => [{ restaurantName: form.restaurantName, ownerName: form.ownerName, at: Date.now() }, ...arr])
      setForm(EMPTY)
      setDishes([])
      toast.success('Lead added and credited to you 🎉')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // ---- GATE ----
  if (phase !== 'ready') {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-50 overflow-x-hidden" style={GRID_BG}>
        <nav className="glass sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2"><Logo size="sm" /></Link>
            <Badge variant="outline" className="border-orange-500/40 text-orange-400 text-[10px]">FIELD</Badge>
          </div>
        </nav>
        <div className="min-h-[80vh] flex items-center justify-center px-4">
          <Card className="bg-zinc-900/70 border-zinc-800 p-8 max-w-sm w-full backdrop-blur">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mx-auto mb-5">
              <KeyRound size={26} className="text-orange-400" />
            </div>
            <h1 className="text-xl font-bold text-center mb-1">Enter your affiliate code</h1>
            <p className="text-sm text-zinc-500 text-center mb-6">Your code unlocks the lead intake and credits every restaurant to you.</p>
            <form onSubmit={(e) => { e.preventDefault(); validateCode(codeInput) }} className="space-y-3">
              <Input
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                placeholder="FL-MARIA-7G2"
                autoCapitalize="characters" autoCorrect="off" spellCheck="false"
                className="bg-zinc-950 border-zinc-800 focus-visible:ring-orange-500 text-center font-mono tracking-wider"
                autoFocus
              />
              <Button type="submit" disabled={checking} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold">
                {checking ? 'Checking…' : 'Unlock intake'}
              </Button>
            </form>
            <p className="mt-5 text-center text-xs text-zinc-500">
              Not an affiliate yet? <Link href="/join" className="text-orange-400 hover:underline">Apply here →</Link>
            </p>
          </Card>
        </div>
      </main>
    )
  }

  // ---- READY ----
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 overflow-x-hidden" style={GRID_BG}>
      <nav className="glass sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2"><Logo size="sm" /></Link>
          <div className="flex items-center gap-2">
            <Link href={`/field/kit?code=${encodeURIComponent(affiliate.code)}`}>
              <Button size="sm" variant="outline" className="border-zinc-800 text-xs"><BookOpen size={13} className="mr-1.5" /> Kit</Button>
            </Link>
            <button onClick={signOut} className="text-xs text-zinc-500 hover:text-orange-400 flex items-center gap-1.5 px-2 py-1.5">
              <LogOut size={13} /> Switch code
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Affiliate header */}
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-500">Logged in as</p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{affiliate.name || 'Affiliate'}</h1>
          </div>
          <span className="inline-flex items-center gap-1.5 text-sm font-mono bg-zinc-900 border border-dashed border-orange-500/50 text-orange-300 rounded-lg px-3 py-1.5">
            <Tag size={13} /> {affiliate.code}
          </span>
        </div>

        {/* Intake form */}
        <Card className="bg-zinc-900/70 border-zinc-800 p-5 sm:p-7 backdrop-blur">
          <div className="flex items-center gap-2 mb-5">
            <Plus size={18} className="text-orange-400" />
            <h2 className="text-lg font-bold">Add a restaurant lead</h2>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-zinc-300 mb-1.5 flex items-center gap-1.5 text-sm"><Store size={14} /> Restaurant name *</Label>
                <Input value={form.restaurantName} onChange={(e) => setForm({ ...form, restaurantName: e.target.value })}
                  placeholder="Trattoria da Mario" autoCapitalize="words" enterKeyHint="next"
                  className="bg-zinc-950 border-zinc-800 focus-visible:ring-orange-500" />
              </div>
              <div>
                <Label className="text-zinc-300 mb-1.5 flex items-center gap-1.5 text-sm"><User size={14} /> Owner / manager *</Label>
                <Input value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                  placeholder="Mario Rossi" autoCapitalize="words" enterKeyHint="next"
                  className="bg-zinc-950 border-zinc-800 focus-visible:ring-orange-500" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-zinc-300 mb-1.5 flex items-center gap-1.5 text-sm"><Instagram size={14} /> Instagram</Label>
                <Input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                  placeholder="@damario_roma" autoCapitalize="none" autoCorrect="off" spellCheck="false"
                  className="bg-zinc-950 border-zinc-800 focus-visible:ring-orange-500" />
              </div>
              <div>
                <Label className="text-zinc-300 mb-1.5 flex items-center gap-1.5 text-sm"><Phone size={14} /> Phone</Label>
                <Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+351 …" autoComplete="tel" inputMode="tel"
                  className="bg-zinc-950 border-zinc-800 focus-visible:ring-orange-500" />
              </div>
            </div>
            <div>
              <Label className="text-zinc-300 mb-1.5 flex items-center gap-1.5 text-sm"><Mail size={14} /> Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="owner@restaurant.com" autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck="false" inputMode="email"
                className="bg-zinc-950 border-zinc-800 focus-visible:ring-orange-500" />
            </div>

            {/* On-the-spot capture */}
            <div>
              <Label className="text-zinc-300 mb-1.5 flex items-center gap-1.5 text-sm"><Camera size={14} /> Photos / videos on the spot (optional)</Label>
              <input ref={fileRef} type="file" accept="image/*,video/*" multiple capture="environment" onChange={handleDishUpload} className="hidden" />
              <button type="button" onClick={() => fileRef.current?.click()}
                className="tap-scale w-full border-2 border-dashed border-zinc-700 hover:border-orange-500 hover:bg-orange-500/5 transition rounded-2xl p-6 text-center group">
                <Upload size={26} className="mx-auto mb-2 text-zinc-500 group-hover:text-orange-500 transition" />
                <div className="text-sm font-semibold text-zinc-200">Tap to capture or upload</div>
                <div className="text-xs text-zinc-500 mt-1">{dishes.length}/5</div>
              </button>
              {dishes.length > 0 && (
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {dishes.map((d, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700">
                      <img src={d.preview} alt={d.name} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button type="submit" disabled={submitting} className="tap-scale w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold glow-orange">
              {submitting ? 'Saving…' : <>Add lead <ArrowRight size={18} className="ml-1.5" /></>}
            </Button>
          </form>
        </Card>

        {/* This session */}
        {sessionLeads.length > 0 && (
          <Card className="bg-zinc-900/70 border-zinc-800 mt-5 overflow-hidden backdrop-blur">
            <div className="px-5 py-3 border-b border-zinc-800 flex items-center gap-2">
              <CheckCircle2 size={15} className="text-green-400" />
              <span className="text-sm font-semibold">Added this session ({sessionLeads.length})</span>
            </div>
            <ul className="divide-y divide-zinc-800">
              {sessionLeads.map((l, i) => (
                <li key={i} className="px-5 py-3 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{l.restaurantName}</span>
                    <span className="text-zinc-500"> · {l.ownerName}</span>
                  </div>
                  <span className="text-xs text-zinc-600">{new Date(l.at).toLocaleTimeString()}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </main>
  )
}

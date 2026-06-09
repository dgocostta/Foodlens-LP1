'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  KeyRound, ArrowLeft, Copy, Link as LinkIcon, Tag, Download, Lock,
  Rocket, Mail, Instagram, Share2, Image as ImageIcon, Presentation,
  GraduationCap, ShieldCheck, TrendingUp, Crown, Gift, Award,
  Video, MonitorPlay, LayoutTemplate, Trophy, Home, CheckCircle2, Circle,
  ListChecks, ClipboardList, Plus, Trash2,
} from 'lucide-react'
import { Logo } from '@/components/logo'
import {
  PROGRAM, tierRangeLabel, money,
  QUICKSTART_TASKS, TARGET_RESTAURANTS, isTaskDone, isUnlocked,
} from '@/lib/affiliate-program'
import { KIT_SECTIONS } from '@/lib/affiliate-kit-content'

const GRID_BG = {
  backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
  backgroundSize: '22px 22px',
}
const ICONS = { Rocket, Mail, Instagram, Share2, ImageIcon, Presentation, GraduationCap, ShieldCheck, Video, MonitorPlay, LayoutTemplate, Trophy }
const WB_STATUS = [
  { id: 'to_contact', label: 'To contact' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'pitched', label: 'Pitched' },
  { id: 'signed', label: 'Signed' },
]
const RANK_ICON = { 'Founding Partner': Crown, Affiliate: Award, Promoter: Rocket }

const copyText = (text) =>
  navigator.clipboard.writeText(text).then(() => toast.success('Copied'), () => toast.error('Could not copy'))

const newId = () => {
  try { return crypto.randomUUID() } catch (e) { return `r-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }
}

const CopyBlock = ({ asset, substitute }) => {
  const [vi, setVi] = useState(0)
  const variants = asset.variants || []
  const active = variants[vi] || variants[0] || { body: '' }
  const text = substitute(active.body || '')
  const useDropdown = variants.length > 4
  const isEmail = /^\s*Subject:/i.test(text)
  const sendEmail = () => {
    const lines = text.split('\n')
    let subject = ''
    let start = 0
    if (/^\s*Subject:/i.test(lines[0] || '')) {
      subject = lines[0].replace(/^\s*Subject:\s*/i, '')
      start = 1
      if ((lines[start] || '').trim() === '') start += 1
    }
    const mailBody = lines.slice(start).join('\n')
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(mailBody)}`
  }
  return (
    <Card className="bg-zinc-900/70 border-zinc-800 p-4">
      <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
        <div>
          <h4 className="font-semibold text-sm">{asset.title}</h4>
          {asset.note && <p className="text-xs text-zinc-500 mt-0.5">{asset.note}</p>}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {isEmail && (
            <Button size="sm" variant="outline" onClick={sendEmail} className="border-zinc-700">
              <Mail size={13} className="mr-1.5" /> Send
            </Button>
          )}
          <Button size="sm" onClick={() => copyText(text)} className="bg-orange-500 hover:bg-orange-600 text-white">
            <Copy size={13} className="mr-1.5" /> Copy
          </Button>
        </div>
      </div>
      {variants.length > 1 && (
        useDropdown ? (
          <select value={vi} onChange={(e) => setVi(Number(e.target.value))}
            className="mb-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500">
            {variants.map((v, i) => <option key={i} value={i}>{v.label}</option>)}
          </select>
        ) : (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {variants.map((v, i) => (
              <button key={i} onClick={() => setVi(i)}
                className={`text-xs px-2.5 py-1 rounded-full border ${vi === i ? 'bg-orange-500 border-orange-500 text-white' : 'border-zinc-700 text-zinc-400 hover:border-orange-500/60'}`}>
                {v.label}
              </button>
            ))}
          </div>
        )
      )}
      <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-sans bg-zinc-950 border border-zinc-800 rounded-lg p-3 max-h-64 overflow-y-auto">{text}</pre>
    </Card>
  )
}

const DownloadAsset = ({ asset }) => {
  const items = asset.items || []
  const ready = items.some((it) => it && typeof it === 'object' && it.href)
  return (
    <Card className="bg-zinc-900/70 border-zinc-800 p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <h4 className="font-semibold text-sm">{asset.title}</h4>
          {asset.note && <p className="text-xs text-zinc-500 mt-0.5">{asset.note}</p>}
        </div>
        <Badge variant="outline" className={`text-[10px] flex-shrink-0 ${ready ? 'border-green-500/50 text-green-300' : 'border-zinc-700 text-zinc-500'}`}>{ready ? 'Ready' : 'Soon'}</Badge>
      </div>
      <ul className="space-y-1.5 mt-2">
        {items.map((it, i) => {
          const obj = it && typeof it === 'object' ? it : { label: it }
          return (
            <li key={i} className="flex items-center justify-between gap-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2">
              <span className="text-zinc-300">{obj.label}</span>
              {obj.href ? (
                <a href={obj.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-orange-400 hover:text-orange-300 font-medium">
                  <Download size={12} /> Open
                </a>
              ) : (
                <span className="text-zinc-600 flex items-center gap-1.5"><Download size={12} /> Soon</span>
              )}
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

const SideItem = ({ icon: Icon, code, label, active, locked, onClick }) => (
  <button onClick={onClick}
    className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 whitespace-nowrap flex-shrink-0 lg:w-full text-left transition ${
      active ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'
    }`}>
    {code && <span className={`text-[10px] font-mono ${active ? 'text-white/70' : 'text-zinc-600'}`}>{code}</span>}
    <Icon size={15} />
    <span className="flex-1">{label}</span>
    {locked && !active && <Lock size={12} className="text-zinc-600" />}
  </button>
)

// Persistent checklist — tickable manual tasks; auto tasks derive from artifacts.
const ChecklistPanel = ({ checklist, workbookCount, unlocked, onToggle, onGoWorkbook }) => {
  const doneCount = QUICKSTART_TASKS.filter((t) => isTaskDone(t, { checklist, workbookCount })).length
  return (
    <Card className="bg-zinc-900/70 border-zinc-800 p-3.5 mt-4">
      <div className="flex items-center gap-2 mb-1">
        <ListChecks size={15} className="text-orange-400" />
        <span className="text-sm font-semibold">Quick-start</span>
        <span className="ml-auto text-xs text-zinc-500">{doneCount}/{QUICKSTART_TASKS.length}</span>
      </div>
      <p className="text-[11px] text-zinc-500 mb-2.5">
        {unlocked ? 'All set — your kit is unlocked.' : 'Finish the required steps to unlock your kit + link.'}
      </p>
      <ul className="space-y-1">
        {QUICKSTART_TASKS.map((t) => {
          const done = isTaskDone(t, { checklist, workbookCount })
          const auto = !!t.auto
          return (
            <li key={t.id}>
              <button
                onClick={() => (auto ? onGoWorkbook() : onToggle(t.id, !done))}
                className="w-full flex items-start gap-2 text-left rounded-md px-1.5 py-1 hover:bg-white/5">
                {done ? <CheckCircle2 size={15} className="text-green-400 mt-0.5 flex-shrink-0" /> : <Circle size={15} className="text-zinc-600 mt-0.5 flex-shrink-0" />}
                <span className="min-w-0">
                  <span className={`text-xs ${done ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>{t.label}</span>
                  {t.mandatory && <span className="ml-1.5 text-[9px] uppercase tracking-wide text-orange-400/80">required</span>}
                  {auto && !done && <span className="block text-[10px] text-zinc-600">Auto-completes from your Workbook ({workbookCount}/{TARGET_RESTAURANTS})</span>}
                  {t.hint && !auto && <span className="block text-[10px] text-zinc-600">{t.hint}</span>}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

const RankBadge = ({ rank, founding }) => {
  const Icon = RANK_ICON[rank] || Rocket
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-orange-500/10 border border-orange-500/40 text-orange-300 rounded-full px-2.5 py-1">
        <Icon size={13} /> {rank}
      </span>
      {founding && (
        <span className="inline-flex items-center gap-1.5 text-xs bg-zinc-900 border border-zinc-700 text-zinc-300 rounded-full px-2.5 py-1" title="Lifetime top-rate lock-in">
          <Crown size={12} className="text-orange-400" /> Founding lock-in
        </span>
      )}
    </div>
  )
}

const HomePanel = ({ affiliate, unlocked, trackingLink }) => (
  <div className="space-y-5">
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Welcome{affiliate.name ? `, ${affiliate.name.split(' ')[0]}` : ''}.</h1>
      <p className="text-zinc-500 mt-1 text-sm">Your home base for referring restaurants.</p>
    </div>

    <Card className="bg-zinc-900/70 border-orange-500/30 p-5 backdrop-blur">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1.5 flex items-center gap-1.5"><Tag size={12} /> Your code</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-lg font-bold font-mono text-orange-300 bg-zinc-950 border border-dashed border-orange-500/50 rounded-lg px-3 py-2 truncate">{affiliate.code}</code>
            <Button size="sm" onClick={() => copyText(affiliate.code)} className="bg-orange-500 hover:bg-orange-600 text-white"><Copy size={13} /></Button>
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1.5 flex items-center gap-1.5"><LinkIcon size={12} /> Your tracking link</div>
          {unlocked ? (
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono text-zinc-300 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 truncate">{trackingLink}</code>
              <Button size="sm" onClick={() => copyText(trackingLink)} className="bg-orange-500 hover:bg-orange-600 text-white"><Copy size={13} /></Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-zinc-500 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5">
              <Lock size={13} /> Unlocks after the required steps
            </div>
          )}
        </div>
      </div>
      {unlocked && (
        <p className="text-xs text-zinc-500 mt-3">Swipe copy in each section uses <code className="text-orange-300">{'{{LINK}}'}</code> and <code className="text-orange-300">{'{{CODE}}'}</code> — already filled with your details when you copy.</p>
      )}
    </Card>

    <Card className="bg-zinc-900/70 border-zinc-800 p-5 backdrop-blur">
      <div className="flex items-center gap-2 mb-3">
        <Gift size={16} className="text-orange-400" />
        <h2 className="font-bold">Your program — {PROGRAM.statusName}</h2>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {PROGRAM.commission.tiers.map((t, i) => (
          <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-center">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500">{tierRangeLabel(PROGRAM.commission.tiers, i)} venues</div>
            <div className="text-2xl font-bold text-gradient-orange">{t.rate}%</div>
          </div>
        ))}
      </div>
      <ul className="space-y-1.5 text-xs text-zinc-400">
        {PROGRAM.commission.retroactive && (
          <li className="flex items-start gap-2"><TrendingUp size={13} className="text-orange-400 mt-0.5 flex-shrink-0" /> Retroactive — crossing a tier lifts every venue you have signed to the new rate.</li>
        )}
        <li className="flex items-start gap-2"><Crown size={13} className="text-orange-400 mt-0.5 flex-shrink-0" /> {PROGRAM.bonuses.foundingLockIn}</li>
        <li className="flex items-start gap-2"><Gift size={13} className="text-orange-400 mt-0.5 flex-shrink-0" /> {money(PROGRAM.bonuses.fastStart.amount)} Fast-Start + {money(PROGRAM.bonuses.recruiter.amount)} Recruiter reward.</li>
      </ul>
    </Card>
  </div>
)

const WorkbookPanel = ({ workbook, onChange }) => {
  const [name, setName] = useState('')
  const [area, setArea] = useState('')
  const [notes, setNotes] = useState(workbook.notes || '')
  const restaurants = workbook.restaurants || []

  const add = () => {
    if (!name.trim()) { toast.error('Add a restaurant name'); return }
    const next = { ...workbook, notes, restaurants: [{ id: newId(), name: name.trim().slice(0, 200), area: area.trim().slice(0, 200), notes: '', status: 'to_contact', leadId: null, createdAt: new Date().toISOString() }, ...restaurants] }
    setName(''); setArea('')
    onChange(next)
  }
  const update = (id, patch) => onChange({ ...workbook, notes, restaurants: restaurants.map((r) => (r.id === id ? { ...r, ...patch } : r)) })
  const remove = (id) => onChange({ ...workbook, notes, restaurants: restaurants.filter((r) => r.id !== id) })

  const signed = restaurants.filter((r) => r.status === 'signed').length

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Workbook</h2>
          <p className="text-sm text-zinc-500 mt-1">Your target restaurants — keep it all here, not on paper.</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gradient-orange">{restaurants.length}<span className="text-sm text-zinc-500"> / {TARGET_RESTAURANTS}</span></div>
          <div className="text-[11px] text-zinc-500">{signed} signed</div>
        </div>
      </div>

      <Card className="bg-zinc-900/70 border-zinc-800 p-4">
        <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Restaurant name *" className="bg-zinc-950 border-zinc-800 h-9 text-sm" onKeyDown={(e) => { if (e.key === 'Enter') add() }} />
          <Input value={area} onChange={(e) => setArea(e.target.value)} placeholder="Area / note (optional)" className="bg-zinc-950 border-zinc-800 h-9 text-sm" onKeyDown={(e) => { if (e.key === 'Enter') add() }} />
          <Button onClick={add} className="bg-orange-500 hover:bg-orange-600 text-white h-9"><Plus size={15} className="mr-1.5" /> Add</Button>
        </div>
      </Card>

      {restaurants.length === 0 ? (
        <Card className="bg-zinc-900/40 border-dashed border-zinc-800 p-8 text-center text-sm text-zinc-600">
          No targets yet. Add {TARGET_RESTAURANTS} restaurants you can reach — that unlocks your quick-start targets step.
        </Card>
      ) : (
        <div className="space-y-2">
          {restaurants.map((r) => (
            <Card key={r.id} className="bg-zinc-900/70 border-zinc-800 p-3">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{r.name}</div>
                  {r.area && <div className="text-xs text-zinc-500 truncate">{r.area}</div>}
                </div>
                <select value={r.status} onChange={(e) => update(r.id, { status: e.target.value })}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg text-xs px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500">
                  {WB_STATUS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
                <button onClick={() => remove(r.id)} className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-white/5"><Trash2 size={14} /></button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="bg-zinc-900/70 border-zinc-800 p-4">
        <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Notes</div>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => onChange({ ...workbook, notes })}
          rows={4} placeholder="Anything to remember — angles, contacts, follow-ups…"
          className="bg-zinc-950 border-zinc-800 resize-none text-sm" />
      </Card>
    </div>
  )
}

export default function DashboardPage() {
  const [phase, setPhase] = useState('gate')
  const [codeInput, setCodeInput] = useState('')
  const [checking, setChecking] = useState(false)
  const [affiliate, setAffiliate] = useState({ code: '', name: '', avatarUrl: '', rank: 'Promoter', founding: false, checklist: {}, workbook: { restaurants: [], notes: '' } })
  const [active, setActive] = useState('home')

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
      setAffiliate({
        code: data.code || code,
        name: data.name || '',
        avatarUrl: data.avatarUrl || '',
        rank: data.rank || 'Promoter',
        founding: !!data.founding,
        checklist: data.checklist || {},
        workbook: data.workbook || { restaurants: [], notes: '' },
      })
      setPhase('ready')
      try { localStorage.setItem('fl_affiliate_code', data.code || code) } catch (e) {}
    } catch (err) {
      if (!silent) toast.error(err.message)
    } finally {
      setChecking(false)
    }
  }

  const toggleTask = async (taskId, done) => {
    setAffiliate((a) => ({ ...a, checklist: { ...a.checklist, [taskId]: { done, completedAt: done ? new Date().toISOString() : null } } }))
    try {
      const res = await fetch('/api/affiliates/checklist', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: affiliate.code, taskId, done }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Could not save')
      if (data.checklist) setAffiliate((a) => ({ ...a, checklist: data.checklist }))
    } catch (e) { toast.error(e.message) }
  }

  const saveWorkbook = async (nextWorkbook) => {
    setAffiliate((a) => ({ ...a, workbook: nextWorkbook }))
    try {
      const res = await fetch('/api/affiliates/workbook', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: affiliate.code, workbook: nextWorkbook }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Could not save workbook')
    } catch (e) { toast.error(e.message) }
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://demo.foodlensgroup.com'
  const trackingLink = `${origin}/?ref=${affiliate.code}`
  const fieldLink = `${origin}/field?code=${affiliate.code}`
  const substitute = (s) =>
    String(s)
      .replace(/\{\{CODE\}\}/g, affiliate.code)
      .replace(/\{\{LINK_FIELD\}\}/g, fieldLink)
      .replace(/\{\{LINK\}\}/g, trackingLink)

  const workbookCount = (affiliate.workbook?.restaurants || []).length
  const unlocked = isUnlocked({ checklist: affiliate.checklist, workbookCount })

  // ---- GATE ----
  if (phase !== 'ready') {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-50 overflow-x-hidden" style={GRID_BG}>
        <nav className="glass sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2"><Logo size="sm" /></Link>
            <Badge variant="outline" className="border-orange-500/40 text-orange-400 text-[10px]">DASHBOARD</Badge>
          </div>
        </nav>
        <div className="min-h-[80vh] flex items-center justify-center px-4">
          <Card className="bg-zinc-900/70 border-zinc-800 p-8 max-w-sm w-full backdrop-blur">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mx-auto mb-5">
              <KeyRound size={26} className="text-orange-400" />
            </div>
            <h1 className="text-xl font-bold text-center mb-1">Open your Affiliate Dashboard</h1>
            <p className="text-sm text-zinc-500 text-center mb-6">Enter your affiliate code to unlock your dashboard, scripts and assets.</p>
            <form onSubmit={(e) => { e.preventDefault(); validateCode(codeInput) }} className="space-y-3">
              <Input value={codeInput} onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                placeholder="FL-MARIA-7G2" autoCapitalize="characters" autoCorrect="off" spellCheck="false"
                className="bg-zinc-950 border-zinc-800 focus-visible:ring-orange-500 text-center font-mono tracking-wider" autoFocus />
              <Button type="submit" disabled={checking} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold">
                {checking ? 'Checking…' : 'Open dashboard'}
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

  const activeSection = KIT_SECTIONS.find((s) => s.id === active)

  // ---- READY (dashboard) ----
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 overflow-x-hidden" style={GRID_BG}>
      <nav className="glass sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2"><Logo size="sm" /></Link>
          <Link href={`/field?code=${encodeURIComponent(affiliate.code)}`}>
            <Button size="sm" variant="outline" className="border-zinc-800 text-xs"><ArrowLeft size={13} className="mr-1.5" /> Add a lead</Button>
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 lg:flex lg:gap-6">
        <aside className="lg:w-64 lg:flex-shrink-0 mb-4 lg:mb-0">
          <div className="flex items-center gap-2 mb-3 px-1">
            {affiliate.avatarUrl
              ? <img src={affiliate.avatarUrl} alt={affiliate.name} className="w-10 h-10 rounded-full object-cover border border-zinc-700" />
              : <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 font-semibold">{(affiliate.name || '?').charAt(0).toUpperCase()}</div>}
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">{affiliate.name || 'Affiliate'}</div>
              <div className="text-[11px] font-mono text-orange-300 truncate">{affiliate.code}</div>
            </div>
          </div>
          <div className="px-1 mb-3"><RankBadge rank={affiliate.rank} founding={affiliate.founding} /></div>
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-1">
            <SideItem icon={Home} label="Home" active={active === 'home'} onClick={() => setActive('home')} />
            <SideItem icon={ClipboardList} label="Workbook" active={active === 'workbook'} onClick={() => setActive('workbook')} />
            {KIT_SECTIONS.map((s) => {
              const Icon = ICONS[s.icon] || Rocket
              return (
                <SideItem key={s.id} icon={Icon} code={s.code} label={s.title}
                  active={active === s.id} locked={!unlocked}
                  onClick={() => setActive(s.id)} />
              )
            })}
          </nav>
          <div className="hidden lg:block">
            <ChecklistPanel checklist={affiliate.checklist} workbookCount={workbookCount} unlocked={unlocked}
              onToggle={toggleTask} onGoWorkbook={() => setActive('workbook')} />
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <div className="lg:hidden mb-4">
            <ChecklistPanel checklist={affiliate.checklist} workbookCount={workbookCount} unlocked={unlocked}
              onToggle={toggleTask} onGoWorkbook={() => setActive('workbook')} />
          </div>

          {active === 'home' ? (
            <HomePanel affiliate={affiliate} unlocked={unlocked} trackingLink={trackingLink} />
          ) : active === 'workbook' ? (
            <WorkbookPanel workbook={affiliate.workbook} onChange={saveWorkbook} />
          ) : !unlocked ? (
            <Card className="bg-zinc-900/60 border-zinc-800 p-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto mb-4">
                <Lock size={24} className="text-zinc-400" />
              </div>
              <h3 className="text-lg font-bold mb-1.5">Finish the required steps first</h3>
              <p className="text-sm text-zinc-500 max-w-sm mx-auto mb-5">Complete the required quick-start steps (watch the welcome video, read the rules, list {TARGET_RESTAURANTS} targets) to unlock your kit and tracking link.</p>
              <Button onClick={() => setActive('home')} className="bg-orange-500 hover:bg-orange-600 text-white"><Home size={14} className="mr-1.5" /> Back to Home</Button>
            </Card>
          ) : (
            <section>
              <div className="flex items-center gap-2.5 mb-3">
                <span className="text-xs font-mono text-zinc-600">{activeSection?.code}</span>
                <h2 className="text-2xl font-bold tracking-tight">{activeSection?.title}</h2>
                {activeSection?.phase && <Badge variant="outline" className="border-zinc-700 text-zinc-500 text-[10px]">{activeSection.phase} · soon</Badge>}
              </div>
              {activeSection?.blurb && <p className="text-sm text-zinc-500 mb-4">{activeSection.blurb}</p>}
              {(activeSection?.assets || []).length === 0 ? (
                <Card className="bg-zinc-900/40 border-dashed border-zinc-800 p-10 text-center text-sm text-zinc-600">
                  Coming soon — assets for this category land here.
                </Card>
              ) : (
                <div className="space-y-3">
                  {activeSection.assets.map((asset) =>
                    asset.type === 'download'
                      ? <DownloadAsset key={asset.id} asset={asset} />
                      : <CopyBlock key={asset.id} asset={asset} substitute={substitute} />,
                  )}
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </main>
  )
}

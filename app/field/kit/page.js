'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  KeyRound, ArrowLeft, Copy, Link as LinkIcon, Tag, Download, Lock,
  Rocket, Mail, Instagram, Share2, Image as ImageIcon, Presentation,
  GraduationCap, ShieldCheck, TrendingUp, Crown, Gift,
  Video, MonitorPlay, LayoutTemplate, Trophy,
} from 'lucide-react'
import { Logo } from '@/components/logo'
import { PROGRAM, tierRangeLabel, money } from '@/lib/affiliate-program'
import { KIT_SECTIONS } from '@/lib/affiliate-kit-content'

const GRID_BG = {
  backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
  backgroundSize: '22px 22px',
}
const ICONS = { Rocket, Mail, Instagram, Share2, ImageIcon, Presentation, GraduationCap, ShieldCheck, Video, MonitorPlay, LayoutTemplate, Trophy }

const copyText = (text) =>
  navigator.clipboard.writeText(text).then(() => toast.success('Copied'), () => toast.error('Could not copy'))

const CopyBlock = ({ asset, substitute }) => {
  const [vi, setVi] = useState(0)
  const variants = asset.variants || []
  const active = variants[vi] || variants[0] || { body: '' }
  const text = substitute(active.body || '')
  const useDropdown = variants.length > 4
  return (
    <Card className="bg-zinc-900/70 border-zinc-800 p-4">
      <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
        <div>
          <h4 className="font-semibold text-sm">{asset.title}</h4>
          {asset.note && <p className="text-xs text-zinc-500 mt-0.5">{asset.note}</p>}
        </div>
        <Button size="sm" onClick={() => copyText(text)} className="bg-orange-500 hover:bg-orange-600 text-white flex-shrink-0">
          <Copy size={13} className="mr-1.5" /> Copy
        </Button>
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

const DownloadAsset = ({ asset }) => (
  <Card className="bg-zinc-900/70 border-zinc-800 p-4">
    <div className="flex items-start justify-between gap-3 mb-2">
      <div>
        <h4 className="font-semibold text-sm">{asset.title}</h4>
        {asset.note && <p className="text-xs text-zinc-500 mt-0.5">{asset.note}</p>}
      </div>
      <Badge variant="outline" className="border-zinc-700 text-zinc-500 text-[10px] flex-shrink-0">Soon</Badge>
    </div>
    <ul className="space-y-1.5 mt-2">
      {(asset.items || []).map((it, i) => (
        <li key={i} className="flex items-center justify-between gap-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2">
          <span className="text-zinc-300">{it}</span>
          <span className="text-zinc-600 flex items-center gap-1.5"><Download size={12} /> Soon</span>
        </li>
      ))}
    </ul>
  </Card>
)

export default function KitPage() {
  const [phase, setPhase] = useState('gate')
  const [codeInput, setCodeInput] = useState('')
  const [checking, setChecking] = useState(false)
  const [affiliate, setAffiliate] = useState({ code: '', name: '' })

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
    } finally {
      setChecking(false)
    }
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://demo.foodlensgroup.com'
  const trackingLink = `${origin}/?ref=${affiliate.code}`
  const fieldLink = `${origin}/field?code=${affiliate.code}`
  const substitute = (s) =>
    String(s)
      .replace(/\{\{CODE\}\}/g, affiliate.code)
      .replace(/\{\{LINK_FIELD\}\}/g, fieldLink)
      .replace(/\{\{LINK\}\}/g, trackingLink)

  // ---- GATE ----
  if (phase !== 'ready') {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-50 overflow-x-hidden" style={GRID_BG}>
        <nav className="glass sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2"><Logo size="sm" /></Link>
            <Badge variant="outline" className="border-orange-500/40 text-orange-400 text-[10px]">KIT</Badge>
          </div>
        </nav>
        <div className="min-h-[80vh] flex items-center justify-center px-4">
          <Card className="bg-zinc-900/70 border-zinc-800 p-8 max-w-sm w-full backdrop-blur">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mx-auto mb-5">
              <KeyRound size={26} className="text-orange-400" />
            </div>
            <h1 className="text-xl font-bold text-center mb-1">Open your Affiliate Kit</h1>
            <p className="text-sm text-zinc-500 text-center mb-6">Enter your affiliate code to unlock your scripts, copy and assets.</p>
            <form onSubmit={(e) => { e.preventDefault(); validateCode(codeInput) }} className="space-y-3">
              <Input value={codeInput} onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                placeholder="FL-MARIA-7G2" autoCapitalize="characters" autoCorrect="off" spellCheck="false"
                className="bg-zinc-950 border-zinc-800 focus-visible:ring-orange-500 text-center font-mono tracking-wider" autoFocus />
              <Button type="submit" disabled={checking} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold">
                {checking ? 'Checking…' : 'Open kit'}
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2"><Logo size="sm" /></Link>
          <Link href={`/field?code=${encodeURIComponent(affiliate.code)}`}>
            <Button size="sm" variant="outline" className="border-zinc-800 text-xs"><ArrowLeft size={13} className="mr-1.5" /> Back to intake</Button>
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Affiliate Kit</h1>
          <p className="text-zinc-500 mt-1">{affiliate.name ? `${affiliate.name} — everything` : 'Everything'} you need to start referring restaurants.</p>
        </div>

        {/* Code + tracking link */}
        <Card className="bg-zinc-900/70 border-orange-500/30 p-5 mb-5 backdrop-blur">
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
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono text-zinc-300 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 truncate">{trackingLink}</code>
                <Button size="sm" onClick={() => copyText(trackingLink)} className="bg-orange-500 hover:bg-orange-600 text-white"><Copy size={13} /></Button>
              </div>
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-3">Swipe copy below uses <code className="text-orange-300">{'{{LINK}}'}</code> and <code className="text-orange-300">{'{{CODE}}'}</code> — already filled with your details when you copy.</p>
        </Card>

        {/* Program summary */}
        <Card className="bg-zinc-900/70 border-zinc-800 p-5 mb-8 backdrop-blur">
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
              <li className="flex items-start gap-2"><TrendingUp size={13} className="text-orange-400 mt-0.5 flex-shrink-0" /> Retroactive — crossing a tier lifts every venue you've signed to the new rate.</li>
            )}
            <li className="flex items-start gap-2"><Crown size={13} className="text-orange-400 mt-0.5 flex-shrink-0" /> {PROGRAM.bonuses.foundingLockIn}</li>
            <li className="flex items-start gap-2"><Gift size={13} className="text-orange-400 mt-0.5 flex-shrink-0" /> {money(PROGRAM.bonuses.fastStart.amount)} Fast-Start + {money(PROGRAM.bonuses.recruiter.amount)} Recruiter reward.</li>
          </ul>
        </Card>

        {/* Sections */}
        <div className="space-y-10">
          {KIT_SECTIONS.map((section) => {
            const Icon = ICONS[section.icon] || Rocket
            const empty = (section.assets || []).length === 0
            return (
              <section key={section.id}>
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="text-xs font-mono text-zinc-600">{section.code}</span>
                  <Icon size={18} className="text-orange-400" />
                  <h3 className="text-lg font-bold">{section.title}</h3>
                  {section.phase && <Badge variant="outline" className="border-zinc-700 text-zinc-500 text-[10px]">{section.phase} · soon</Badge>}
                </div>
                {section.blurb && <p className="text-sm text-zinc-500 mb-4">{section.blurb}</p>}
                {empty ? (
                  <Card className="bg-zinc-900/40 border-dashed border-zinc-800 p-6 text-center text-sm text-zinc-600">
                    Coming soon — assets for this category land here.
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {section.assets.map((asset) =>
                      asset.type === 'download'
                        ? <DownloadAsset key={asset.id} asset={asset} />
                        : <CopyBlock key={asset.id} asset={asset} substitute={substitute} />,
                    )}
                  </div>
                )}
              </section>
            )
          })}
        </div>

        <div className="mt-12 pt-6 border-t border-zinc-900 flex items-center justify-between text-sm text-zinc-500">
          <span className="flex items-center gap-2"><Logo size="xs" /></span>
          <Link href="/admin" className="flex items-center gap-1.5 hover:text-orange-400 transition"><Lock size={12} /> Admin</Link>
        </div>
      </div>
    </main>
  )
}

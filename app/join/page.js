'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  Sparkles, ArrowRight, Check, Gift, Megaphone, Tag, Share2, Wand2,
  HandCoins, Users, Mail, Phone, Instagram, User, CheckCircle2, Lock,
  TrendingUp, Repeat, Award, Rocket, Crown, BadgePercent,
} from 'lucide-react'
import { Logo } from '@/components/logo'
import { PROGRAM, tierRangeLabel, money } from '@/lib/affiliate-program'

const STEPS = [
  { icon: Megaphone, title: 'Apply in 60 seconds', body: 'Tell us who you are and the restaurant crowd you reach. No fees, no commitment.' },
  { icon: Tag, title: 'Get approved + your code', body: 'We review every applicant by hand. Approved? You get a personal affiliate code and your kit.' },
  { icon: Share2, title: 'Refer restaurants', body: 'Share your code. Every restaurant you bring in is tracked and credited to you automatically.' },
  { icon: Gift, title: 'Get rewarded', body: 'We turn their dishes into cinema video menus — you get rewarded for every one you sign up.' },
]

const PERKS = [
  { icon: Repeat, title: 'Recurring, for life', body: `Earn a share of every restaurant's monthly subscription — for the entire life of the account, not a one-off.` },
  { icon: TrendingUp, title: 'Retroactive tiers', body: 'Bring on more restaurants, earn a higher rate — and crossing a tier lifts ALL of them to the new rate.' },
  { icon: Crown, title: `Become a ${PROGRAM.statusName}`, body: PROGRAM.bonuses.foundingLockIn },
]

export default function JoinPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', social: '', audience: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [ref, setRef] = useState({ code: '', name: '' })

  // Recruiter referral: if an existing affiliate sent them here with ?ref=CODE,
  // validate it and pass it along so the recruiter gets credited on approval.
  useEffect(() => {
    let code = ''
    try { code = new URLSearchParams(window.location.search).get('ref') || '' } catch (e) {}
    code = String(code).trim().toUpperCase()
    if (!code) return
    fetch(`/api/affiliates/validate?code=${encodeURIComponent(code)}`)
      .then((r) => r.json())
      .then((d) => { if (d?.valid) setRef({ code: d.code || code, name: d.name || '' }) })
      .catch(() => {})
  }, [])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const scrollToForm = () => document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth' })

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email) {
      toast.error('Your name and email are required')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, referredBy: ref.code }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="relative min-h-screen bg-zinc-950 text-zinc-50 overflow-x-hidden">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-3 md:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3"><Logo size="sm" /></Link>
          <Button onClick={scrollToForm} className="h-11 md:h-12 text-sm md:text-base px-5 md:px-6 bg-orange-500 hover:bg-orange-600 text-white font-semibold tap-scale">
            Apply now <ArrowRight size={16} className="ml-1.5" />
          </Button>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-24 overflow-hidden">
        <div className="absolute inset-0 grain opacity-40" />
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -right-20 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="outline" className="mb-5 border-orange-500/40 bg-orange-500/10 text-orange-300">
              <Sparkles size={12} className="mr-1.5" /> FoodLens {PROGRAM.statusName} Program
            </Badge>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-balance leading-[1.05]">
              Get paid to put restaurants<br />
              <span className="text-gradient-orange">on the map.</span>
            </h1>
            <p className="mt-5 md:mt-7 text-base sm:text-xl md:text-2xl text-zinc-400 max-w-2xl md:max-w-3xl mx-auto text-balance leading-relaxed">
              Know restaurant owners? Refer them to FoodLens. We turn their dishes into
              <span className="text-orange-400 font-medium"> cinema video menus</span> — and pay you <span className="text-orange-400 font-medium">recurring commission for the life of every account</span>.
            </p>
            <div className="mt-8 md:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
              <Button onClick={scrollToForm} className="tablet-btn-lg bg-orange-500 hover:bg-orange-600 text-white glow-orange tap-scale w-full sm:w-auto">
                Become an affiliate <ArrowRight size={20} className="ml-2" />
              </Button>
            </div>
            <div className="mt-6 md:mt-8 flex flex-wrap items-center justify-center gap-4 md:gap-6 text-xs md:text-sm text-zinc-500">
              <span className="flex items-center gap-1.5"><Check size={14} className="text-orange-500" /> Free to join</span>
              <span className="flex items-center gap-1.5"><Check size={14} className="text-orange-500" /> Recurring + lifetime</span>
              <span className="flex items-center gap-1.5"><Check size={14} className="text-orange-500" /> First {PROGRAM.foundingCap} lock their rate for life</span>
            </div>
          </div>
        </div>
      </section>

      {/* PERKS */}
      <section className="relative py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-3 gap-5">
            {PERKS.map((p) => (
              <Card key={p.title} className="bg-zinc-900/60 border-zinc-800 p-6">
                <div className="w-11 h-11 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mb-4">
                  <p.icon size={20} className="text-orange-400" />
                </div>
                <h3 className="text-lg font-bold mb-1.5">{p.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{p.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* EARNINGS */}
      <section className="relative py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <Badge variant="outline" className="mb-4 border-orange-500/40 bg-orange-500/10 text-orange-300">
              <BadgePercent size={12} className="mr-1.5" /> How you earn
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Recurring commission that <span className="text-gradient-orange">grows with you</span></h2>
            <p className="text-zinc-400 mt-3">Your commission is a share of {PROGRAM.commission.basis}. The more active restaurants you bring on, the higher your rate.</p>
          </div>

          <Card className="bg-zinc-900/60 border-zinc-800 overflow-hidden mb-5">
            <div className="grid grid-cols-3 divide-x divide-zinc-800">
              {PROGRAM.commission.tiers.map((t, i) => (
                <div key={i} className="p-5 sm:p-6 text-center">
                  <div className="text-[11px] sm:text-xs uppercase tracking-wider text-zinc-500 mb-2">{tierRangeLabel(PROGRAM.commission.tiers, i)} restaurants</div>
                  <div className="text-4xl sm:text-5xl font-bold text-gradient-orange">{t.rate}%</div>
                  <div className="text-[11px] sm:text-xs text-zinc-500 mt-2">of monthly revenue</div>
                </div>
              ))}
            </div>
          </Card>

          {PROGRAM.commission.retroactive && (
            <p className="text-center text-sm text-zinc-400 mb-10 flex items-center justify-center gap-2 flex-wrap">
              <TrendingUp size={15} className="text-orange-400" /> Retroactive — cross a tier and <strong className="text-zinc-200">every</strong> restaurant you've signed jumps to the new rate.
            </p>
          )}

          <div className="grid sm:grid-cols-3 gap-5">
            <Card className="bg-zinc-900/60 border-orange-500/30 p-6">
              <Crown size={20} className="text-orange-400 mb-3" />
              <h3 className="font-bold mb-1.5">{PROGRAM.statusName} lock-in</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{PROGRAM.bonuses.foundingLockIn}</p>
            </Card>
            <Card className="bg-zinc-900/60 border-zinc-800 p-6">
              <Rocket size={20} className="text-orange-400 mb-3" />
              <h3 className="font-bold mb-1.5">{money(PROGRAM.bonuses.fastStart.amount)} Fast-Start</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{PROGRAM.bonuses.fastStart.label}.</p>
            </Card>
            <Card className="bg-zinc-900/60 border-zinc-800 p-6">
              <Users size={20} className="text-orange-400 mb-3" />
              <h3 className="font-bold mb-1.5">{money(PROGRAM.bonuses.recruiter.amount)} Recruiter reward</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{PROGRAM.bonuses.recruiter.label}.</p>
            </Card>
          </div>

          <p className="text-center text-sm text-zinc-500 mt-8 flex items-center justify-center gap-2 flex-wrap">
            <Award size={15} className="text-orange-400" /> More rewards unlock as you grow:{' '}
            {PROGRAM.bonuses.milestones.map((m) => `${m.active}+ → ${m.reward}`).join('   ·   ')}
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">How it <span className="text-gradient-orange">works</span></h2>
            <p className="text-zinc-400 mt-3">From application to your first reward — four simple steps.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map((s, i) => (
              <Card key={s.title} className="bg-zinc-900/60 border-zinc-800 p-6 relative">
                <div className="text-5xl font-black text-orange-500/15 absolute top-3 right-4 select-none">{i + 1}</div>
                <s.icon size={22} className="text-orange-400 mb-4" />
                <h3 className="font-bold mb-1.5">{s.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{s.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* APPLY */}
      <section id="apply" className="relative py-16 sm:py-24 scroll-mt-24">
        <div className="absolute top-1/3 -right-20 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl" />
        <div className="relative max-w-2xl mx-auto px-4 sm:px-6">
          {submitted ? (
            <Card className="bg-zinc-900/70 border-orange-500/30 p-8 sm:p-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 size={32} className="text-orange-400" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">Application received! 🎉</h2>
              <p className="text-zinc-400 leading-relaxed mb-6">
                Thanks{form.name ? `, ${form.name.split(' ')[0]}` : ''} — we review every applicant by hand. If you're approved you'll join as a{' '}
                {PROGRAM.statusName}, and we'll email your personal affiliate code + kit link so you can start right away.
              </p>
              <Link href="/"><Button variant="outline" className="border-zinc-700 hover:bg-white/5 hover:border-orange-500/50">Back to FoodLens</Button></Link>
            </Card>
          ) : (
            <Card className="bg-zinc-900/70 border-zinc-800 p-6 sm:p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold">Apply to become an affiliate</h2>
                <p className="text-zinc-400 mt-2 text-sm">Takes under a minute. We'll be in touch by email.</p>
              </div>
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <Label className="text-zinc-300 mb-1.5 flex items-center gap-1.5"><User size={13} /> Your name *</Label>
                  <Input value={form.name} onChange={set('name')} placeholder="Maria Silva" className="bg-zinc-950 border-zinc-800 focus-visible:ring-orange-500" />
                </div>
                <div>
                  <Label className="text-zinc-300 mb-1.5 flex items-center gap-1.5"><Mail size={13} /> Email *</Label>
                  <Input type="email" value={form.email} onChange={set('email')} placeholder="maria@email.com" className="bg-zinc-950 border-zinc-800 focus-visible:ring-orange-500" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-zinc-300 mb-1.5 flex items-center gap-1.5"><Phone size={13} /> Phone</Label>
                    <Input value={form.phone} onChange={set('phone')} placeholder="+351 …" className="bg-zinc-950 border-zinc-800 focus-visible:ring-orange-500" />
                  </div>
                  <div>
                    <Label className="text-zinc-300 mb-1.5 flex items-center gap-1.5"><Instagram size={13} /> Social handle</Label>
                    <Input value={form.social} onChange={set('social')} placeholder="@yourhandle" className="bg-zinc-950 border-zinc-800 focus-visible:ring-orange-500" />
                  </div>
                </div>
                <div>
                  <Label className="text-zinc-300 mb-1.5 flex items-center gap-1.5"><Megaphone size={13} /> Tell us about your audience</Label>
                  <Textarea value={form.audience} onChange={set('audience')} rows={3}
                    placeholder="Who do you reach? Restaurant owners you know, your following, your city…"
                    className="bg-zinc-950 border-zinc-800 focus-visible:ring-orange-500 resize-none" />
                </div>
                {ref.name && (
                  <div className="flex items-center justify-center gap-1.5 text-xs text-orange-300 bg-orange-500/10 border border-orange-500/30 rounded-lg py-2">
                    <CheckCircle2 size={13} /> Referred by {ref.name}
                  </div>
                )}
                <Button type="submit" disabled={submitting} className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold tap-scale">
                  {submitting ? 'Submitting…' : <>Submit application <ArrowRight size={18} className="ml-1.5" /></>}
                </Button>
                <p className="text-xs text-zinc-600 text-center">No fees. We'll never share your details.</p>
              </form>
            </Card>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-900 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
          <div className="flex items-center gap-2.5">
            <Logo size="xs" />
            <span>© 2025 — Turn every dish into a 5-second sales pitch.</span>
          </div>
          <Link href="/admin" className="flex items-center gap-1.5 hover:text-orange-400 transition">
            <Lock size={12} /> Admin
          </Link>
        </div>
      </footer>
    </main>
  )
}

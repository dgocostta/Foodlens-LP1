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
  Play, Pause, ChevronUp, ChevronDown, Heart, Share2, Star, Sparkles,
  Clapperboard, FileText, Camera, Instagram, Phone, Store, User,
  Check, ArrowRight, Upload, Zap, Globe, Gift, ShieldCheck, Presentation,
  Volume2, VolumeX, Lock, TrendingUp, Mail
} from 'lucide-react'
import { DEFAULT_DISHES } from '@/lib/foodlens-data'
import { Logo } from '@/components/logo'

const PhoneFrame = ({ children, className = '' }) => (
  <div className={`relative mx-auto ${className}`}>
    <div className="relative w-[300px] h-[620px] sm:w-[340px] sm:h-[700px] md:w-[380px] md:h-[780px] rounded-[3rem] bg-zinc-900 border-[10px] md:border-[12px] border-zinc-800 shadow-2xl shadow-orange-500/10 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 md:w-36 h-7 md:h-8 bg-zinc-950 rounded-b-2xl z-30" />
      <div className="absolute inset-0 rounded-[2.2rem] overflow-hidden">{children}</div>
    </div>
    <div className="absolute -inset-4 bg-orange-500/20 blur-3xl -z-10 rounded-full" />
  </div>
)

const CinemaMenu = () => {
  const [idx, setIdx] = useState(0)
  const [muted, setMuted] = useState(true)
  const [liked, setLiked] = useState({})
  const [dishes, setDishes] = useState(DEFAULT_DISHES)
  const videoRefs = useRef({})
  const containerRef = useRef(null)

  // Fetch admin-managed dish overrides
  useEffect(() => {
    fetch('/api/settings/media')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d?.dishes) && d.dishes.length > 0) {
          // Use override only if it has valid video URLs
          const valid = d.dishes.filter((x) => x.video)
          if (valid.length) setDishes(valid)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([key, v]) => {
      if (!v) return
      if (Number(key) === idx) {
        v.play().catch(() => {})
      } else {
        v.pause()
      }
    })
  }, [idx, dishes])

  const next = () => setIdx((i) => Math.min(dishes.length - 1, i + 1))
  const prev = () => setIdx((i) => Math.max(0, i - 1))

  return (
    <div ref={containerRef} className="relative h-full w-full bg-black">
      {dishes.map((dish, i) => (
        <div
          key={dish.id}
          className={`absolute inset-0 transition-transform duration-500 ease-out ${
            i === idx ? 'translate-y-0' : i < idx ? '-translate-y-full' : 'translate-y-full'
          }`}
        >
          <video
            ref={(el) => (videoRefs.current[i] = el)}
            src={dish.video}
            poster={dish.poster}
            loop
            muted={muted}
            playsInline
            preload="metadata"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/90" />
          <div className="absolute top-8 left-0 right-0 px-4 flex items-center justify-between text-xs text-white/70">
            <img src="https://customer-assets.emergentagent.com/wingman/6e978d7c-1e64-42c4-b4ae-a71d4297a51c/attachments/b2e12e6cc719455bbc9b633b05df069b_image.png" alt="FoodLens" className="h-4 w-auto opacity-80" />
            <button onClick={() => setMuted((m) => !m)} className="p-2 rounded-full bg-black/40 backdrop-blur">
              {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-5 pb-8 text-white">
            <Badge className="mb-2 bg-orange-500 hover:bg-orange-500 text-white border-0">{dish.tag}</Badge>
            <h3 className="text-2xl font-bold tracking-tight">{dish.name}</h3>
            <p className="text-sm text-white/80 mt-1 leading-snug">{dish.desc}</p>
            <div className="flex items-center justify-between mt-4">
              <div className="text-3xl font-bold text-gradient-orange">{dish.price}</div>
              <div className="flex items-center gap-1 text-yellow-400 text-sm">
                <Star size={14} fill="currentColor" /> 4.9
              </div>
            </div>
            <button className="mt-4 w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-2xl text-sm transition active:scale-95">
              Order • {dish.price}
            </button>
          </div>
          <div className="absolute right-3 bottom-40 flex flex-col gap-4 items-center">
            <button
              onClick={() => setLiked((l) => ({ ...l, [dish.id]: !l[dish.id] }))}
              className="p-2.5 rounded-full bg-black/40 backdrop-blur active:scale-90 transition"
            >
              <Heart
                size={20}
                className={liked[dish.id] ? 'text-orange-500 fill-orange-500' : 'text-white'}
              />
            </button>
            <button className="p-2.5 rounded-full bg-black/40 backdrop-blur">
              <Share2 size={20} className="text-white" />
            </button>
          </div>
        </div>
      ))}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">
        <button onClick={prev} disabled={idx === 0} className="p-2 rounded-full bg-white/10 backdrop-blur disabled:opacity-30">
          <ChevronUp size={16} className="text-white" />
        </button>
        <button onClick={next} disabled={idx === dishes.length - 1} className="p-2 rounded-full bg-white/10 backdrop-blur disabled:opacity-30">
          <ChevronDown size={16} className="text-white" />
        </button>
      </div>
      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-20">
        {dishes.map((_, i) => (
          <div
            key={i}
            className={`w-1 rounded-full transition-all ${i === idx ? 'h-6 bg-orange-500' : 'h-1.5 bg-white/40'}`}
          />
        ))}
      </div>
    </div>
  )
}

const BoringPdfMenu = () => (
  <div className="h-full w-full bg-zinc-100 text-zinc-900 overflow-hidden relative">
    <div className="p-6 font-serif">
      <h2 className="text-center text-xl font-bold mb-1 uppercase tracking-widest">Menu</h2>
      <p className="text-center text-xs text-zinc-500 mb-4">Established 1987</p>
      <div className="border-t border-b border-zinc-300 py-2 text-center text-xs uppercase tracking-wider mb-4">
        Antipasti
      </div>
      {[
        ['Bruschetta al pomodoro', '8.50'],
        ['Insalata Caprese', '11.00'],
        ['Carpaccio di manzo', '14.00'],
        ['Burrata pugliese', '12.50'],
      ].map(([name, price]) => (
        <div key={name} className="flex justify-between text-xs py-1.5 border-b border-dotted border-zinc-300">
          <span>{name}</span>
          <span>€{price}</span>
        </div>
      ))}
      <div className="border-t border-b border-zinc-300 py-2 text-center text-xs uppercase tracking-wider my-4">
        Primi
      </div>
      {[
        ['Spaghetti alla carbonara', '13.00'],
        ['Risotto ai funghi porcini', '16.00'],
        ['Pappardelle al tartufo', '24.00'],
        ['Lasagna della casa', '14.00'],
        ['Gnocchi al pesto', '12.00'],
      ].map(([name, price]) => (
        <div key={name} className="flex justify-between text-xs py-1.5 border-b border-dotted border-zinc-300">
          <span>{name}</span>
          <span>€{price}</span>
        </div>
      ))}
      <div className="border-t border-b border-zinc-300 py-2 text-center text-xs uppercase tracking-wider my-4">
        Secondi
      </div>
      {[
        ['Bistecca alla fiorentina', '38.00'],
        ['Branzino al forno', '26.00'],
        ['Pollo al limone', '17.00'],
      ].map(([name, price]) => (
        <div key={name} className="flex justify-between text-xs py-1.5 border-b border-dotted border-zinc-300">
          <span>{name}</span>
          <span>€{price}</span>
        </div>
      ))}
    </div>
    <div className="absolute bottom-3 left-0 right-0 text-center text-[10px] text-zinc-400">page 1 of 4 • PDF</div>
  </div>
)

export default function App() {
  const [form, setForm] = useState({
    restaurantName: '', ownerName: '', instagram: '', phone: '', email: '',
  })
  const [dishes, setDishes] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const fileRef = useRef(null)

  const handleDishUpload = (e) => {
    const files = Array.from(e.target.files || [])
    const newDishes = files.slice(0, 5 - dishes.length).map((f) => ({
      name: f.name,
      preview: URL.createObjectURL(f),
      size: f.size,
    }))
    setDishes([...dishes, ...newDishes])
    if (newDishes.length) toast.success(`${newDishes.length} dish${newDishes.length > 1 ? 'es' : ''} added`)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.restaurantName || !form.ownerName) {
      toast.error('Restaurant name and your name are required')
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
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast.success("You're in. Let's see the magic.")
      // Redirect to onboarding asset upload
      const params = new URLSearchParams({ r: form.restaurantName, o: form.ownerName, id: data.lead?.id || '' })
      window.location.href = `/onboarding?${params.toString()}`
    } catch (err) {
      toast.error(err.message)
      setSubmitting(false)
    }
  }

  const scrollToForm = () => {
    document.getElementById('intake')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <main className="relative min-h-screen bg-zinc-950 text-zinc-50 overflow-x-hidden">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <Link href="/presentation">
              <Button variant="ghost" className="h-11 md:h-12 text-sm md:text-base px-4 md:px-5 text-zinc-300 hover:text-white hover:bg-white/10 tap-scale">
                <Presentation size={16} className="mr-1.5" /> Showcase
              </Button>
            </Link>
            <Button onClick={scrollToForm} className="h-11 md:h-12 text-sm md:text-base px-5 md:px-6 bg-orange-500 hover:bg-orange-600 text-white font-semibold tap-scale">
              Get Started <ArrowRight size={16} className="ml-1.5" />
            </Button>
          </div>
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
              <Sparkles size={12} className="mr-1.5" /> Founding Member Offer — Limited
            </Badge>
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-balance leading-[1.05]">
              Stop showing PDFs.<br />
              <span className="text-gradient-orange">Start selling vibes.</span>
            </h1>
            <p className="mt-5 md:mt-7 text-base sm:text-xl md:text-2xl text-zinc-400 max-w-2xl md:max-w-3xl mx-auto text-balance leading-relaxed">
              Your menu shouldn’t kill the appetite. FoodLens turns every dish into a mouth-watering 5-second cinema clip
              that <span className="text-orange-400 font-medium">sells itself</span>.
            </p>
            <div className="mt-8 md:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
              <Button onClick={scrollToForm} className="tablet-btn-lg bg-orange-500 hover:bg-orange-600 text-white glow-orange tap-scale w-full sm:w-auto">
                Claim 30 Days Free <ArrowRight size={20} className="ml-2" />
              </Button>
              <Link href="/presentation" className="w-full sm:w-auto">
                <Button variant="outline" className="tablet-btn-lg border-zinc-700 hover:bg-white/5 hover:border-orange-500/50 tap-scale w-full sm:w-auto">
                  <Presentation size={20} className="mr-2" /> Open Showcase
                </Button>
              </Link>
            </div>
            <div className="mt-6 md:mt-8 flex flex-wrap items-center justify-center gap-4 md:gap-6 text-xs md:text-sm text-zinc-500">
              <span className="flex items-center gap-1.5"><Check size={14} className="text-orange-500" /> No credit card</span>
              <span className="flex items-center gap-1.5"><Check size={14} className="text-orange-500" /> We create your videos</span>
              <span className="flex items-center gap-1.5"><Check size={14} className="text-orange-500" /> Live in 48h</span>
            </div>
          </div>

          {/* Side-by-side comparison */}
          <div className="mt-16 sm:mt-24 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="order-1 lg:order-1">
              <div className="flex items-center gap-2 text-zinc-500 text-sm mb-4">
                <FileText size={16} /> THE OLD WAY
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-zinc-300 mb-3">A boring PDF nobody reads.</h3>
              <p className="text-zinc-500 mb-6">
                Tiny black text. No photos. No story. Tourists squint, locals scroll past, and your
                signature dish gets ignored. Your menu is your salesperson — don’t make it whisper.
              </p>
              <PhoneFrame>
                <BoringPdfMenu />
              </PhoneFrame>
            </div>
            <div className="order-2 lg:order-2">
              <div className="flex items-center gap-2 text-orange-400 text-sm mb-4">
                <Clapperboard size={16} /> THE FOODLENS WAY
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-3">A cinema reel they can’t stop scrolling.</h3>
              <p className="text-zinc-400 mb-6">
                Every dish becomes a sizzling 5-second short. Sound. Steam. Sauce drizzle. Your customer
                <span className="text-orange-400 font-medium"> orders with their eyes first</span>.
              </p>
              <PhoneFrame>
                <CinemaMenu />
              </PhoneFrame>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF MARQUEE */}
      <section className="py-8 border-y border-zinc-900 overflow-hidden bg-zinc-950">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...Array(2)].map((_, j) => (
            <div key={j} className="flex items-center gap-12 px-6 text-zinc-600 text-sm uppercase tracking-widest">
              <span>+38% Avg Order Value</span><span>•</span>
              <span>2.4x Time on Menu</span><span>•</span>
              <span>+19% New Customers</span><span>•</span>
              <span>4.8★ Owner Rating</span><span>•</span>
              <span>Live in 48 Hours</span><span>•</span>
            </div>
          ))}
        </div>
      </section>

      {/* INTAKE FORM */}
      <section id="intake" className="relative py-20 sm:py-28">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-orange-600/10 blur-3xl rounded-full" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <Badge className="bg-orange-500/15 text-orange-300 border-orange-500/30 mb-4" variant="outline">
              <Zap size={12} className="mr-1.5" /> Lock In On The Spot
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-balance">
              Let’s get your <span className="text-gradient-orange">first 5 dishes</span>
            </h2>
            <p className="mt-3 text-zinc-400 max-w-xl mx-auto">
              Takes 60 seconds. No card. We create your videos from your photos. You go live in 48 hours.
            </p>
          </div>

          {submitted ? (
            <Card className="bg-zinc-900/60 border-orange-500/30 p-8 sm:p-12 text-center backdrop-blur">
              <div className="w-16 h-16 mx-auto rounded-full bg-orange-500 flex items-center justify-center mb-5">
                <Check size={32} className="text-white" strokeWidth={3} />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-2">Welcome to the family, {form.ownerName.split(' ')[0]}.</h3>
              <p className="text-zinc-400 max-w-md mx-auto">
                We'll be in touch shortly to get your first dishes live. <strong className="text-orange-400">{form.restaurantName}</strong> is going cinematic.
              </p>
              <Button onClick={() => { setSubmitted(false); setForm({restaurantName:'',ownerName:'',instagram:'',phone:'',email:''}); setDishes([]) }} variant="outline" className="mt-6 border-zinc-700">
                Sign Up Another Restaurant
              </Button>
            </Card>
          ) : (
            <Card className="bg-zinc-900/60 border-zinc-800 p-6 sm:p-8 md:p-10 backdrop-blur">
              <form onSubmit={submit} className="space-y-5 md:space-y-6">
                <div className="grid sm:grid-cols-2 gap-4 md:gap-5">
                  <div>
                    <Label className="text-zinc-300 mb-2 flex items-center gap-1.5 text-sm md:text-base"><Store size={14} /> Restaurant Name *</Label>
                    <Input
                      value={form.restaurantName}
                      onChange={(e) => setForm({...form, restaurantName: e.target.value})}
                      placeholder="Trattoria da Mario"
                      autoComplete="organization"
                      autoCapitalize="words"
                      enterKeyHint="next"
                      className="tablet-input bg-zinc-950 border-zinc-800 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                    />
                  </div>
                  <div>
                    <Label className="text-zinc-300 mb-2 flex items-center gap-1.5 text-sm md:text-base"><User size={14} /> Owner / Manager *</Label>
                    <Input
                      value={form.ownerName}
                      onChange={(e) => setForm({...form, ownerName: e.target.value})}
                      placeholder="Mario Rossi"
                      autoComplete="name"
                      autoCapitalize="words"
                      enterKeyHint="next"
                      className="tablet-input bg-zinc-950 border-zinc-800 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4 md:gap-5">
                  <div>
                    <Label className="text-zinc-300 mb-2 flex items-center gap-1.5 text-sm md:text-base"><Instagram size={14} /> Instagram Handle</Label>
                    <Input
                      value={form.instagram}
                      onChange={(e) => setForm({...form, instagram: e.target.value})}
                      placeholder="@damario_roma"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck="false"
                      inputMode="text"
                      enterKeyHint="next"
                      className="tablet-input bg-zinc-950 border-zinc-800 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                    />
                  </div>
                  <div>
                    <Label className="text-zinc-300 mb-2 flex items-center gap-1.5 text-sm md:text-base"><Phone size={14} /> Phone</Label>
                    <Input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({...form, phone: e.target.value})}
                      placeholder="+39 ..."
                      autoComplete="tel"
                      inputMode="tel"
                      enterKeyHint="done"
                      className="tablet-input bg-zinc-950 border-zinc-800 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-zinc-300 mb-2 flex items-center gap-1.5 text-sm md:text-base"><Mail size={14} /> Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({...form, email: e.target.value})}
                    placeholder="you@restaurant.com"
                    autoComplete="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    inputMode="email"
                    enterKeyHint="next"
                    className="tablet-input bg-zinc-950 border-zinc-800 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                  />
                  <p className="mt-1.5 text-xs text-zinc-500">We'll send your confirmation here.</p>
                </div>

                {/* Dish upload */}
                <div>
                  <Label className="text-zinc-300 mb-2 flex items-center gap-1.5 text-sm md:text-base">
                    <Camera size={14} /> Upload your first 5 dishes (optional — we create them for you)
                  </Label>
                  <input ref={fileRef} type="file" accept="image/*,video/*" multiple onChange={handleDishUpload} className="hidden" />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="tap-scale w-full border-2 border-dashed border-zinc-700 hover:border-orange-500 hover:bg-orange-500/5 transition rounded-2xl p-8 md:p-12 text-center group"
                  >
                    <Upload size={32} className="mx-auto mb-3 text-zinc-500 group-hover:text-orange-500 transition" />
                    <div className="text-base md:text-lg font-semibold text-zinc-200">Tap to add photos or videos</div>
                    <div className="text-xs md:text-sm text-zinc-500 mt-1.5">{dishes.length}/5 dishes</div>
                  </button>
                  {dishes.length > 0 && (
                    <div className="mt-3 grid grid-cols-5 gap-2 md:gap-3">
                      {dishes.map((d, i) => (
                        <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700">
                          <img src={d.preview} alt={d.name} className="w-full h-full object-cover" />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                            <span className="text-[9px] md:text-[10px] text-white truncate block">{d.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button type="submit" disabled={submitting} className="tap-scale w-full tablet-btn-lg bg-orange-500 hover:bg-orange-600 text-white glow-orange">
                  {submitting ? 'Locking it in…' : (<>🔥 Claim My 30 Days Free <ArrowRight size={20} className="ml-2" /></>)}
                </Button>
                <p className="text-xs md:text-sm text-center text-zinc-500">By signing up you agree to a free 30-day trial. Cancel anytime, no questions.</p>
              </form>
            </Card>
          )}
        </div>
      </section>

      {/* FOUNDING OFFER */}
      <section className="relative py-20 sm:py-28 border-t border-zinc-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="border-orange-500/40 bg-orange-500/10 text-orange-300 mb-4 py-1.5 px-3 text-sm">
              <Gift size={14} className="mr-1.5" /> Founding Restaurant Offer
            </Badge>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-balance">
              For the first <span className="text-gradient-orange">100 restaurants</span> only.
            </h2>
            <p className="mt-4 text-zinc-400 md:text-lg max-w-xl mx-auto">
              Founder pricing. Locked in for life. After 100 — the price triples and the seat is gone.
            </p>

            {/* Spots counter */}
            <div className="mt-6 inline-flex flex-col items-center gap-2">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl md:text-5xl font-bold text-gradient-orange tabular-nums">37</span>
                <span className="text-lg text-zinc-500 font-bold">/ 100 taken</span>
              </div>
              <div className="w-56 md:w-64 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full" style={{ width: '37%' }} />
              </div>
            </div>
          </div>

          {/* ACV Boost callout */}
          <div className="max-w-3xl mx-auto mb-10 p-6 md:p-8 rounded-3xl bg-gradient-to-br from-orange-500/15 via-orange-500/5 to-transparent border border-orange-500/30">
            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
              <div className="flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center">
                <TrendingUp size={28} className="text-orange-400" />
              </div>
              <div className="flex-1">
                <div className="text-xs md:text-sm font-semibold uppercase tracking-widest text-orange-300">Real Result</div>
                <div className="text-2xl md:text-4xl font-bold mt-1">+38% Average Cart Value</div>
                <p className="text-sm md:text-base text-zinc-400 mt-1.5">
                  €19 more per table. €17,000+ extra per month. Pays for itself on day one.
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: Gift, title: '30 Days Free', desc: 'No credit card. No catch. Cancel anytime, no questions.' },
              { icon: ShieldCheck, title: 'Concierge Setup', desc: 'Send your dish photos — we create, edit, and publish. Videographer on request.' },
              { icon: Globe, title: 'Auto Translations', desc: 'Tourists from any country read your menu in their own language.' },
            ].map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="bg-zinc-900/60 border-zinc-800 p-6 hover:border-orange-500/40 transition group">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4 group-hover:bg-orange-500/20 transition">
                  <Icon size={22} className="text-orange-400" />
                </div>
                <h3 className="text-lg font-bold mb-1.5">{title}</h3>
                <p className="text-sm text-zinc-400">{desc}</p>
              </Card>
            ))}
          </div>
          <div className="mt-10 md:mt-12 text-center">
            <Button onClick={scrollToForm} className="tap-scale tablet-btn-lg bg-orange-500 hover:bg-orange-600 text-white glow-orange">
              Claim My Founding Seat <ArrowRight size={20} className="ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-900 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
          <div className="flex items-center gap-2.5">
            <Logo size="xs" />
            <span>© 2025 — For restaurants that refuse to go quietly.</span>
          </div>
          <Link href="/admin" className="flex items-center gap-1.5 hover:text-orange-400 transition">
            <Lock size={12} /> Admin
          </Link>
        </div>
      </footer>
    </main>
  )
}

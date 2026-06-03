'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import useEmblaCarousel from 'embla-carousel-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Logo } from '@/components/logo'
import { DEFAULT_DISHES } from '@/lib/foodlens-data'
import {
  X, ChevronLeft, ChevronRight, FileText, Clapperboard, Sparkles,
  Globe, Instagram, Camera, Gift, ShieldCheck, ArrowRight, Heart,
  TrendingUp, Eye, Zap
} from 'lucide-react'

const SLIDES = [
  { id: 'intro' },
  { id: 'problem' },
  { id: 'solution' },
  { id: 'tech' },
  { id: 'offer' },
  { id: 'cta' },
]

export default function PresentationPage() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
    dragFree: false,
    skipSnaps: false,
    containScroll: 'trimSnaps',
    duration: 28,
  })
  const [selected, setSelected] = useState(0)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelected(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
  }, [emblaApi, onSelect])

  useEffect(() => {
    const handler = (e) => {
      if (!emblaApi) return
      if (e.key === 'ArrowRight' || e.key === ' ') emblaApi.scrollNext()
      if (e.key === 'ArrowLeft') emblaApi.scrollPrev()
      if (e.key === 'Escape') window.location.href = '/'
      if (e.key === 'Home') emblaApi.scrollTo(0)
      if (e.key === 'End') emblaApi.scrollTo(SLIDES.length - 1)
    }
    window.addEventListener('keydown', handler)
    // Request fullscreen on tablet-sized screens
    const tryFs = () => {
      if (document.documentElement.requestFullscreen && window.innerWidth >= 768 && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {})
      }
    }
    const once = () => { tryFs(); document.removeEventListener('pointerdown', once) }
    document.addEventListener('pointerdown', once)
    return () => {
      window.removeEventListener('keydown', handler)
      document.removeEventListener('pointerdown', once)
    }
  }, [emblaApi])

  return (
    <main className="fixed inset-0 bg-black text-white overflow-hidden touch-pan-x select-none">
      {/* Top control bar */}
      <div className="absolute top-0 left-0 right-0 z-50 px-4 sm:px-8 md:px-10 py-4 md:py-5 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2.5 pointer-events-auto">
          <Logo size="sm" />
          <span className="hidden md:inline font-bold text-sm md:text-base tracking-tight text-zinc-300">— The Pitch</span>
        </div>
        <div className="flex items-center gap-3 md:gap-4 pointer-events-auto">
          <span className="text-xs md:text-sm text-zinc-400 font-mono tabular-nums">{String(selected + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}</span>
          <Link href="/">
            <Button size="icon" variant="ghost" className="h-10 w-10 md:h-11 md:w-11 rounded-full hover:bg-white/10 tap-scale">
              <X size={18} />
            </Button>
          </Link>
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute top-16 md:top-20 left-0 right-0 z-40 px-4 sm:px-8 md:px-10">
        <div className="flex gap-1.5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden tap-scale"
              aria-label={`Go to slide ${i + 1}`}
            >
              <div className={`h-full bg-orange-500 transition-all duration-700 ease-out ${
                i < selected ? 'w-full' : i === selected ? 'w-full' : 'w-0'
              }`} />
            </button>
          ))}
        </div>
      </div>

      {/* Carousel */}
      <div className="h-full overflow-hidden" ref={emblaRef}>
        <div className="flex h-full">
          <SlideIntro active={selected === 0} />
          <SlideProblem active={selected === 1} />
          <SlideSolution active={selected === 2} />
          <SlideTech active={selected === 3} />
          <SlideOffer active={selected === 4} />
          <SlideCTA active={selected === 5} />
        </div>
      </div>

      {/* Nav arrows — bigger tactile for tablet */}
      <button
        onClick={() => emblaApi?.scrollPrev()}
        disabled={selected === 0}
        aria-label="Previous slide"
        className="tap-scale absolute left-3 sm:left-6 md:left-8 top-1/2 -translate-y-1/2 z-50 w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 hidden sm:flex items-center justify-center hover:bg-white/10 active:bg-white/15 transition disabled:opacity-20 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={() => emblaApi?.scrollNext()}
        disabled={selected === SLIDES.length - 1}
        aria-label="Next slide"
        className="tap-scale absolute right-3 sm:right-6 md:right-8 top-1/2 -translate-y-1/2 z-50 w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 hidden sm:flex items-center justify-center hover:bg-white/10 active:bg-white/15 transition disabled:opacity-20 disabled:cursor-not-allowed"
      >
        <ChevronRight size={24} />
      </button>

      {/* Bottom hint */}
      <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-40 text-[10px] md:text-xs uppercase tracking-[0.2em] text-zinc-600">
        Swipe to navigate →
      </div>
    </main>
  )
}

const SlideShell = ({ children, active, className = '' }) => (
  <div className={`flex-[0_0_100%] min-w-0 h-screen flex items-center justify-center px-6 sm:px-12 md:px-16 py-24 sm:py-0 relative ${className}`}>
    <div className={`w-full max-w-6xl mx-auto transition-all duration-700 ease-out ${active ? 'opacity-100 scale-100' : 'opacity-40 scale-[0.97]'}`}>
      {children}
    </div>
  </div>
)

// Slide 1: Intro / Title
const SlideIntro = ({ active }) => (
  <SlideShell active={active}>
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] md:w-[700px] md:h-[700px] bg-orange-600/30 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] md:w-[600px] md:h-[600px] bg-orange-500/20 rounded-full blur-[100px]" />
    </div>
    <div className="relative text-center">
      <img
        src="https://customer-assets.emergentagent.com/wingman/6e978d7c-1e64-42c4-b4ae-a71d4297a51c/attachments/b2e12e6cc719455bbc9b633b05df069b_image.png"
        alt="FoodLens"
        className="h-16 md:h-24 w-auto mx-auto mb-6 md:mb-8 drop-shadow-[0_4px_24px_rgba(255,90,31,0.5)]"
      />
      <Badge variant="outline" className="border-orange-500/40 bg-orange-500/10 text-orange-300 mb-6 text-sm md:text-base py-1.5 px-3">
        <Sparkles size={14} className="mr-1.5" /> A 5-Minute Pitch
      </Badge>
      <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight leading-[0.95] text-balance">
        Your menu is your<br />
        <span className="text-gradient-orange">best salesperson.</span>
      </h1>
      <p className="mt-8 md:mt-10 text-lg sm:text-2xl md:text-3xl text-zinc-400 max-w-2xl md:max-w-3xl mx-auto">
        Right now — it’s a PDF. Let’s fix that.
      </p>
      <div className="mt-12 md:mt-16 inline-flex items-center gap-3 text-xs md:text-sm uppercase tracking-[0.25em] text-zinc-500">
        <span className="w-8 md:w-12 h-px bg-zinc-700" /> FoodLens for {new Date().getFullYear()} <span className="w-8 md:w-12 h-px bg-zinc-700" />
      </div>
    </div>
  </SlideShell>
)

// Slide 2: Problem
const SlideProblem = ({ active }) => (
  <SlideShell active={active}>
    <div className="grid lg:grid-cols-2 gap-10 md:gap-14 items-center">
      <div>
        <Badge variant="outline" className="border-red-500/30 bg-red-500/5 text-red-400 mb-5 text-sm md:text-base py-1.5 px-3">01 — The Problem</Badge>
        <h2 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-tight text-balance">
          Boring PDFs are <span className="text-red-400">killing</span> the vibe — and your sales.
        </h2>
        <div className="mt-8 md:mt-10 space-y-4 md:space-y-5">
          {[
            { stat: '83%', label: 'of customers can’t picture a dish from a text-only menu.' },
            { stat: '€11k', label: 'lost yearly per restaurant from unconverted browsing tourists.' },
            { stat: '< 4s', label: 'spent on the average PDF menu before bouncing.' },
          ].map((item) => (
            <div key={item.stat} className="flex items-start gap-4 md:gap-6 border-l-2 border-red-500/40 pl-4 md:pl-5">
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-red-400 shrink-0 w-24 md:w-32">{item.stat}</div>
              <p className="text-zinc-400 pt-2 md:text-lg">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="relative">
        <div className="absolute -inset-8 bg-red-500/10 blur-3xl rounded-full" />
        <div className="relative bg-zinc-100 text-zinc-800 rounded-xl shadow-2xl p-8 sm:p-10 md:p-12 font-serif transform rotate-1">
          <FileText size={32} className="mx-auto mb-4 text-zinc-400" />
          <h3 className="text-center text-xl md:text-2xl font-bold uppercase tracking-widest mb-4">Menu</h3>
          <div className="space-y-2 text-sm md:text-base">
            {['Bruschetta al pomodoro — €8.50','Spaghetti carbonara — €13.00','Pappardelle al tartufo — €24.00','Bistecca fiorentina — €38.00','Tiramisù della casa — €8.00'].map((l) => (
              <div key={l} className="border-b border-dotted border-zinc-300 py-1.5 md:py-2">{l}</div>
            ))}
          </div>
          <div className="text-center text-xs text-zinc-400 mt-6">page 1 of 4 • PDF</div>
        </div>
      </div>
    </div>
  </SlideShell>
)

// Slide 3: Solution
const SlideSolution = ({ active }) => {
  // Pull the first admin-managed dish so the deck matches the live menu (and never goes stale).
  const [dish, setDish] = useState(DEFAULT_DISHES[0])
  useEffect(() => {
    fetch('/api/settings/media')
      .then((r) => r.json())
      .then((d) => {
        const first = Array.isArray(d?.dishes) ? d.dishes.find((x) => x.video || x.poster) : null
        if (first) setDish(first)
      })
      .catch(() => {})
  }, [])

  return (
  <SlideShell active={active}>
    <div className="grid lg:grid-cols-2 gap-10 md:gap-14 items-center">
      <div className="order-2 lg:order-1 relative">
        <div className="absolute -inset-12 bg-orange-500/20 blur-3xl rounded-full" />
        <div className="relative mx-auto w-[260px] h-[540px] md:w-[300px] md:h-[620px] rounded-[2.5rem] bg-zinc-900 border-[8px] md:border-[10px] border-zinc-800 shadow-2xl shadow-orange-500/30 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 md:w-28 h-5 md:h-6 bg-zinc-950 rounded-b-xl z-10" />
          {dish.video ? (
            <video
              src={dish.video}
              poster={dish.poster}
              autoPlay loop muted playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img src={dish.poster} alt={dish.name} className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-4 right-4">
            <Badge className="bg-orange-500 hover:bg-orange-500 text-white border-0 mb-2">{dish.tag || 'Chef’s Pick'}</Badge>
            <h3 className="text-xl md:text-2xl font-bold">{dish.name}</h3>
            <div className="text-2xl md:text-3xl font-bold text-gradient-orange mt-1">{dish.price}</div>
          </div>
        </div>
      </div>
      <div className="order-1 lg:order-2">
        <Badge variant="outline" className="border-orange-500/40 bg-orange-500/10 text-orange-300 mb-5 text-sm md:text-base py-1.5 px-3">02 — The Solution</Badge>
        <h2 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-tight text-balance">
          FoodLens <span className="text-gradient-orange">Cinema Menus.</span>
        </h2>
        <p className="mt-5 md:mt-7 text-lg sm:text-xl md:text-2xl text-zinc-400 leading-relaxed">
          Visual. Interactive. High-conversion. Every dish becomes a sizzling 5-second short the customer scrolls
          like TikTok — and orders with their eyes.
        </p>
        <div className="mt-6 md:mt-8 p-5 md:p-6 rounded-2xl bg-gradient-to-br from-orange-500/15 via-orange-500/5 to-transparent border border-orange-500/30">
          <div className="flex items-center gap-2 text-orange-300 text-xs md:text-sm font-semibold uppercase tracking-widest mb-2">
            <TrendingUp size={16} /> The ACV Boost
          </div>
          <div className="text-3xl md:text-5xl font-bold leading-tight">
            <span className="text-gradient-orange">+38% Average Cart Value</span>
          </div>
          <p className="text-sm md:text-base text-zinc-400 mt-2">
            On a €50 ticket, that's <strong className="text-orange-400">€19 more per table</strong>. Across 30 tables a day,
            <strong className="text-orange-400"> €17,000+ extra per month</strong>.
          </p>
        </div>
        <div className="mt-5 md:mt-6 grid grid-cols-2 gap-3 md:gap-4">
          {[
            { icon: Eye, label: '2.4x', sub: 'time on menu' },
            { icon: Heart, label: '+19%', sub: 'new customers' },
          ].map((s) => (
            <div key={s.label} className="glass rounded-2xl md:rounded-3xl p-4 md:p-5 text-center">
              <s.icon size={20} className="mx-auto text-orange-400 mb-2" />
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold">{s.label}</div>
              <div className="text-[10px] md:text-xs uppercase tracking-wider text-zinc-500 mt-1">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </SlideShell>
  )
}

// Slide 4: Tech
const SlideTech = ({ active }) => (
  <SlideShell active={active}>
    <div>
      <div className="text-center mb-12 md:mb-16">
        <Badge variant="outline" className="border-orange-500/40 bg-orange-500/10 text-orange-300 mb-5 text-sm md:text-base py-1.5 px-3">03 — The Tech</Badge>
        <h2 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-tight text-balance">
          You don’t lift a finger. <span className="text-gradient-orange">We handle everything.</span>
        </h2>
      </div>
      <div className="grid md:grid-cols-3 gap-5 md:gap-6">
        {[
          { icon: Camera, title: 'Concierge Setup', desc: 'Our crew comes to your kitchen, films your dishes in cinematic quality, and publishes for you. You just keep cooking.' },
          { icon: Globe, title: 'Auto Translations', desc: 'Tourists from any country read your menu in their native language — instantly. The hidden tourist magnet.' },
          { icon: Instagram, title: 'Instagram Sync', desc: 'Every video pushes to your Instagram and Reels. Your menu becomes content. Your content becomes customers.' },
        ].map((f) => (
          <div key={f.title} className="glass rounded-3xl p-7 md:p-8 hover:border-orange-500/40 transition group">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-orange-500/15 flex items-center justify-center mb-5 md:mb-6 group-hover:bg-orange-500/25 transition">
              <f.icon size={28} className="text-orange-400" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-3">{f.title}</h3>
            <p className="text-zinc-400 md:text-lg leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </SlideShell>
)

// Slide 5: Offer
const SlideOffer = ({ active }) => (
  <SlideShell active={active}>
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] md:w-[900px] h-[700px] md:h-[900px] bg-orange-600/20 rounded-full blur-[120px]" />
    </div>
    <div className="relative text-center">
      <Badge variant="outline" className="border-orange-500/40 bg-orange-500/10 text-orange-300 mb-6 text-sm md:text-base py-1.5 px-3">
        <Gift size={14} className="mr-1.5" /> 04 — The Founding Restaurant Offer
      </Badge>
      <h2 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight leading-[0.95] text-balance">
        Be one of the<br />
        <span className="text-gradient-orange">Founding 100.</span>
      </h2>
      <p className="mt-8 md:mt-10 text-lg sm:text-2xl md:text-3xl text-zinc-400 max-w-2xl md:max-w-3xl mx-auto">
        We're hand-picking the first <strong className="text-orange-400">100 restaurants</strong> in your city to define
        what cinema dining looks like. After that, the price triples — and the seat is gone.
      </p>

      {/* Exclusivity counter */}
      <div className="mt-10 md:mt-12 inline-flex flex-col items-center gap-2">
        <div className="flex items-baseline gap-2 md:gap-3">
          <span className="text-6xl md:text-8xl font-bold text-gradient-orange tabular-nums">37</span>
          <span className="text-2xl md:text-3xl text-zinc-500 font-bold">/ 100</span>
        </div>
        <div className="text-xs md:text-sm uppercase tracking-[0.25em] text-zinc-500">Founding seats taken</div>
        <div className="w-64 md:w-80 h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-2">
          <div className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full" style={{ width: '37%' }} />
        </div>
      </div>

      <div className="mt-10 md:mt-12 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 max-w-4xl mx-auto text-left">
        {[
          { title: '30 Days Free', desc: 'Full platform. No card. Cancel anytime.' },
          { title: 'Concierge Setup', desc: 'Our crew films your kitchen for free.' },
          { title: 'Founder Pricing', desc: 'Locked in for life. Never goes up.' },
        ].map((p) => (
          <div key={p.title} className="glass rounded-2xl p-4 md:p-5">
            <div className="flex items-center gap-2 mb-1.5">
              <ShieldCheck size={16} className="text-orange-400" />
              <div className="font-bold md:text-lg">{p.title}</div>
            </div>
            <p className="text-xs md:text-sm text-zinc-400">{p.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </SlideShell>
)

// Slide 6: CTA
const SlideCTA = ({ active }) => (
  <SlideShell active={active}>
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-orange-500/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-orange-500/15 to-transparent" />
    </div>
    <div className="relative text-center">
      <Badge variant="outline" className="border-orange-500/40 bg-orange-500/10 text-orange-300 mb-6 text-sm md:text-base py-1.5 px-3">
        <Zap size={14} className="mr-1.5" /> 05 — Let’s Go
      </Badge>
      <h2 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight leading-[0.95] text-balance">
        Ready to make<br />
        <span className="text-gradient-orange">your menu cinematic?</span>
      </h2>
      <p className="mt-6 md:mt-8 text-lg sm:text-2xl md:text-3xl text-zinc-400">It takes 60 seconds. Right now. On this screen.</p>
      <Link href="/#intake">
        <button className="tap-scale mt-12 md:mt-16 group relative inline-flex items-center gap-3 bg-orange-500 hover:bg-orange-600 text-white text-xl sm:text-2xl md:text-3xl font-semibold px-10 md:px-14 py-6 md:py-7 rounded-2xl md:rounded-3xl glow-orange transition">
          Join the Cause <ArrowRight size={24} className="group-hover:translate-x-1 transition" />
        </button>
      </Link>
      <p className="mt-8 md:mt-10 text-xs md:text-sm uppercase tracking-[0.25em] text-zinc-600">
        FoodLens — Cinema for restaurants
      </p>
    </div>
  </SlideShell>
)

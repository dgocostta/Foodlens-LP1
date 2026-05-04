'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import useEmblaCarousel from 'embla-carousel-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'start' })
  const [selected, setSelected] = useState(0)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelected(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
  }, [emblaApi, onSelect])

  useEffect(() => {
    const handler = (e) => {
      if (!emblaApi) return
      if (e.key === 'ArrowRight') emblaApi.scrollNext()
      if (e.key === 'ArrowLeft') emblaApi.scrollPrev()
      if (e.key === 'Escape') window.location.href = '/'
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [emblaApi])

  return (
    <main className="fixed inset-0 bg-black text-white overflow-hidden">
      {/* Top control bar */}
      <div className="absolute top-0 left-0 right-0 z-50 px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
            <Clapperboard size={14} className="text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight">FoodLens — The Pitch</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-400 font-mono">{String(selected + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}</span>
          <Link href="/">
            <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-white/10">
              <X size={16} />
            </Button>
          </Link>
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute top-14 left-0 right-0 z-40 px-4 sm:px-8">
        <div className="flex gap-1">
          {SLIDES.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 bg-white/10 rounded-full overflow-hidden">
              <div className={`h-full bg-orange-500 transition-all duration-500 ${i <= selected ? 'w-full' : 'w-0'}`} />
            </div>
          ))}
        </div>
      </div>

      {/* Carousel */}
      <div className="h-full overflow-hidden" ref={emblaRef}>
        <div className="flex h-full">
          <SlideIntro />
          <SlideProblem />
          <SlideSolution />
          <SlideTech />
          <SlideOffer />
          <SlideCTA />
        </div>
      </div>

      {/* Nav arrows */}
      <button
        onClick={() => emblaApi?.scrollPrev()}
        disabled={selected === 0}
        className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-white/5 backdrop-blur border border-white/10 flex items-center justify-center hover:bg-white/10 transition disabled:opacity-20 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={() => emblaApi?.scrollNext()}
        disabled={selected === SLIDES.length - 1}
        className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-white/5 backdrop-blur border border-white/10 flex items-center justify-center hover:bg-white/10 transition disabled:opacity-20 disabled:cursor-not-allowed"
      >
        <ChevronRight size={20} />
      </button>

      {/* Bottom hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 text-[10px] uppercase tracking-widest text-zinc-600">
        Swipe → or use arrow keys
      </div>
    </main>
  )
}

const SlideShell = ({ children, className = '' }) => (
  <div className={`flex-[0_0_100%] min-w-0 h-screen flex items-center justify-center px-6 sm:px-12 relative ${className}`}>
    <div className="w-full max-w-6xl mx-auto">{children}</div>
  </div>
)

// Slide 1: Intro / Title
const SlideIntro = () => (
  <SlideShell>
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-orange-600/30 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-orange-500/20 rounded-full blur-[100px]" />
    </div>
    <div className="relative text-center">
      <Badge variant="outline" className="border-orange-500/40 bg-orange-500/10 text-orange-300 mb-6">
        <Sparkles size={12} className="mr-1.5" /> A 5-Minute Pitch
      </Badge>
      <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95] text-balance">
        Your menu is your<br />
        <span className="text-gradient-orange">best salesperson.</span>
      </h1>
      <p className="mt-8 text-lg sm:text-2xl text-zinc-400 max-w-2xl mx-auto">
        Right now — it’s a PDF. Let’s fix that.
      </p>
      <div className="mt-12 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-zinc-500">
        <span className="w-8 h-px bg-zinc-700" /> FoodLens for {new Date().getFullYear()} <span className="w-8 h-px bg-zinc-700" />
      </div>
    </div>
  </SlideShell>
)

// Slide 2: Problem
const SlideProblem = () => (
  <SlideShell>
    <div className="grid lg:grid-cols-2 gap-10 items-center">
      <div>
        <Badge variant="outline" className="border-red-500/30 bg-red-500/5 text-red-400 mb-5">01 — The Problem</Badge>
        <h2 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight text-balance">
          Boring PDFs are <span className="text-red-400">killing</span> the vibe — and your sales.
        </h2>
        <div className="mt-8 space-y-4">
          {[
            { stat: '83%', label: 'of customers can’t picture a dish from a text-only menu.' },
            { stat: '€11k', label: 'lost yearly per restaurant from unconverted browsing tourists.' },
            { stat: '< 4s', label: 'spent on the average PDF menu before bouncing.' },
          ].map((item) => (
            <div key={item.stat} className="flex items-start gap-4 border-l-2 border-red-500/40 pl-4">
              <div className="text-3xl sm:text-4xl font-bold text-red-400 shrink-0 w-24">{item.stat}</div>
              <p className="text-zinc-400 pt-2">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="relative">
        <div className="absolute -inset-8 bg-red-500/10 blur-3xl rounded-full" />
        <div className="relative bg-zinc-100 text-zinc-800 rounded-xl shadow-2xl p-8 sm:p-10 font-serif transform rotate-1">
          <FileText size={32} className="mx-auto mb-4 text-zinc-400" />
          <h3 className="text-center text-xl font-bold uppercase tracking-widest mb-4">Menu</h3>
          <div className="space-y-2 text-sm">
            {['Bruschetta al pomodoro — €8.50','Spaghetti carbonara — €13.00','Pappardelle al tartufo — €24.00','Bistecca fiorentina — €38.00','Tiramisù della casa — €8.00'].map((l) => (
              <div key={l} className="border-b border-dotted border-zinc-300 py-1.5">{l}</div>
            ))}
          </div>
          <div className="text-center text-xs text-zinc-400 mt-6">page 1 of 4 • PDF</div>
        </div>
      </div>
    </div>
  </SlideShell>
)

// Slide 3: Solution
const SlideSolution = () => (
  <SlideShell>
    <div className="grid lg:grid-cols-2 gap-10 items-center">
      <div className="order-2 lg:order-1 relative">
        <div className="absolute -inset-12 bg-orange-500/20 blur-3xl rounded-full" />
        <div className="relative mx-auto w-[260px] h-[540px] rounded-[2.5rem] bg-zinc-900 border-[8px] border-zinc-800 shadow-2xl shadow-orange-500/30 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-zinc-950 rounded-b-xl z-10" />
          <video
            src="https://assets.mixkit.co/videos/4742/4742-720.mp4"
            autoPlay loop muted playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-4 right-4">
            <Badge className="bg-orange-500 hover:bg-orange-500 text-white border-0 mb-2">Chef’s Pick</Badge>
            <h3 className="text-xl font-bold">Truffle Pappardelle</h3>
            <div className="text-2xl font-bold text-gradient-orange mt-1">€24</div>
          </div>
        </div>
      </div>
      <div className="order-1 lg:order-2">
        <Badge variant="outline" className="border-orange-500/40 bg-orange-500/10 text-orange-300 mb-5">02 — The Solution</Badge>
        <h2 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight text-balance">
          FoodLens <span className="text-gradient-orange">Cinema Menus.</span>
        </h2>
        <p className="mt-5 text-lg sm:text-xl text-zinc-400">
          Visual. Interactive. High-conversion. Every dish becomes a sizzling 5-second short the customer scrolls
          like TikTok — and orders with their eyes.
        </p>
        <div className="mt-8 grid grid-cols-3 gap-3">
          {[
            { icon: Eye, label: '2.4x', sub: 'time on menu' },
            { icon: TrendingUp, label: '+38%', sub: 'avg. order' },
            { icon: Heart, label: '+19%', sub: 'new customers' },
          ].map((s) => (
            <div key={s.label} className="glass rounded-2xl p-4 text-center">
              <s.icon size={18} className="mx-auto text-orange-400 mb-2" />
              <div className="text-2xl sm:text-3xl font-bold">{s.label}</div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 mt-1">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </SlideShell>
)

// Slide 4: Tech
const SlideTech = () => (
  <SlideShell>
    <div>
      <div className="text-center mb-12">
        <Badge variant="outline" className="border-orange-500/40 bg-orange-500/10 text-orange-300 mb-5">03 — The Tech</Badge>
        <h2 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight text-balance">
          You don’t lift a finger. <span className="text-gradient-orange">We handle everything.</span>
        </h2>
      </div>
      <div className="grid md:grid-cols-3 gap-5">
        {[
          { icon: Camera, title: 'Concierge Setup', desc: 'Our crew comes to your kitchen, films your dishes in cinematic quality, and publishes for you. You just keep cooking.' },
          { icon: Globe, title: 'Auto Translations', desc: 'Tourists from any country read your menu in their native language — instantly. The hidden tourist magnet.' },
          { icon: Instagram, title: 'Instagram Sync', desc: 'Every video pushes to your Instagram and Reels. Your menu becomes content. Your content becomes customers.' },
        ].map((f) => (
          <div key={f.title} className="glass rounded-3xl p-7 hover:border-orange-500/40 transition group">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/15 flex items-center justify-center mb-5 group-hover:bg-orange-500/25 transition">
              <f.icon size={26} className="text-orange-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">{f.title}</h3>
            <p className="text-zinc-400 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </SlideShell>
)

// Slide 5: Offer
const SlideOffer = () => (
  <SlideShell>
    <div className="absolute inset-0">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-orange-600/20 rounded-full blur-[120px]" />
    </div>
    <div className="relative text-center">
      <Badge variant="outline" className="border-orange-500/40 bg-orange-500/10 text-orange-300 mb-6">
        <Gift size={12} className="mr-1.5" /> 04 — The Founding Offer
      </Badge>
      <h2 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95] text-balance">
        <span className="text-gradient-orange">30 Days Free.</span><br />
        Full setup. Zero risk.
      </h2>
      <p className="mt-8 text-lg sm:text-2xl text-zinc-400 max-w-2xl mx-auto">
        We come. We film. We launch. You see results in <strong className="text-orange-400">48 hours</strong>.
        If you don’t love it — walk away. No card. No catch.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-3 text-sm">
        {['No credit card', 'Cancel anytime', 'We shoot the videos', 'Live in 48h', 'Founding 100 only'].map((p) => (
          <div key={p} className="glass rounded-full px-4 py-2 flex items-center gap-2">
            <ShieldCheck size={14} className="text-orange-400" /> {p}
          </div>
        ))}
      </div>
    </div>
  </SlideShell>
)

// Slide 6: CTA
const SlideCTA = () => (
  <SlideShell>
    <div className="absolute inset-0">
      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-orange-500/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-orange-500/15 to-transparent" />
    </div>
    <div className="relative text-center">
      <Badge variant="outline" className="border-orange-500/40 bg-orange-500/10 text-orange-300 mb-6">
        <Zap size={12} className="mr-1.5" /> 05 — Let’s Go
      </Badge>
      <h2 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95] text-balance">
        Ready to make<br />
        <span className="text-gradient-orange">your menu cinematic?</span>
      </h2>
      <p className="mt-6 text-lg sm:text-2xl text-zinc-400">It takes 60 seconds. Right now. On this screen.</p>
      <Link href="/#intake">
        <button className="mt-12 group relative inline-flex items-center gap-3 bg-orange-500 hover:bg-orange-600 text-white text-xl sm:text-2xl font-semibold px-10 py-6 rounded-2xl glow-orange transition active:scale-95">
          Join the Cause <ArrowRight size={22} className="group-hover:translate-x-1 transition" />
        </button>
      </Link>
      <p className="mt-8 text-xs uppercase tracking-widest text-zinc-600">
        FoodLens — Cinema for restaurants
      </p>
    </div>
  </SlideShell>
)

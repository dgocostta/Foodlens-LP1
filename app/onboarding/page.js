'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Clapperboard, Upload, ArrowRight, SkipForward, Sparkles, Check,
  Camera, Wand2, Star, TrendingUp
} from 'lucide-react'
import { Logo } from '@/components/logo'

export default function OnboardingPage() {
  const search = useSearchParams()
  const router = useRouter()
  const restaurantName = search.get('r') || 'Your restaurant'
  const ownerFirst = (search.get('o') || '').split(' ')[0] || 'there'
  const [photo, setPhoto] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [done, setDone] = useState(false)
  const fileRef = useRef(null)

  const handleUpload = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setPhoto({ name: f.name, url: URL.createObjectURL(f) })
    // Simulate "magic" processing
    setProcessing(true)
    setTimeout(() => { setProcessing(false); setDone(true) }, 1800)
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 relative overflow-hidden">
      <div className="absolute top-0 -left-40 w-[600px] h-[600px] bg-orange-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top bar */}
      <nav className="relative glass">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size="sm" />
            <Badge variant="outline" className="ml-1 border-orange-500/40 text-orange-400 text-[10px] md:text-xs">STEP 2 OF 2</Badge>
          </div>
          <Link href="/admin" className="text-xs md:text-sm text-zinc-500 hover:text-orange-400">Skip for now →</Link>
        </div>
      </nav>

      <section className="relative max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-10 md:py-16">
        <div className="text-center mb-8 md:mb-12">
          <Badge variant="outline" className="border-orange-500/40 bg-orange-500/10 text-orange-300 mb-4 text-sm py-1.5 px-3">
            <Check size={14} className="mr-1.5 text-orange-400" /> {restaurantName} is locked in
          </Badge>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.05] text-balance">
            One last thing, <span className="text-gradient-orange">{ownerFirst}</span>.
          </h1>
          <p className="mt-4 md:mt-6 text-base md:text-xl text-zinc-400 max-w-xl mx-auto">
            Got a dish photo on your phone? Upload it now and watch it become a cinema clip. Or skip — Patric brings the camera tomorrow.
          </p>
        </div>

        {!photo && (
          <Card className="bg-zinc-900/60 border-zinc-800 p-6 md:p-10 backdrop-blur">
            <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleUpload} className="hidden" />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="tap-scale w-full border-2 border-dashed border-zinc-700 hover:border-orange-500 hover:bg-orange-500/5 transition rounded-3xl p-10 md:p-16 text-center group"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 mx-auto rounded-2xl bg-orange-500/15 flex items-center justify-center mb-4 group-hover:bg-orange-500/25 group-hover:scale-105 transition">
                <Upload size={32} className="text-orange-400" />
              </div>
              <div className="text-lg md:text-2xl font-bold text-zinc-100">Tap to upload your hero dish</div>
              <div className="text-sm md:text-base text-zinc-500 mt-2">Any photo or video works. We'll cinematize it.</div>
            </button>

            <div className="mt-6 grid grid-cols-3 gap-3 md:gap-4 text-center">
              {[
                { icon: Camera, label: 'Camera roll' },
                { icon: Wand2, label: 'Auto-enhanced' },
                { icon: Sparkles, label: 'Live preview' },
              ].map((f) => (
                <div key={f.label} className="glass rounded-xl py-3 md:py-4">
                  <f.icon size={18} className="mx-auto text-orange-400 mb-1.5" />
                  <div className="text-xs md:text-sm text-zinc-400">{f.label}</div>
                </div>
              ))}
            </div>

            <button
              onClick={() => router.push('/?signed=1')}
              className="tap-scale mt-6 w-full text-zinc-400 hover:text-white text-sm md:text-base flex items-center justify-center gap-2 py-3"
            >
              <SkipForward size={16} /> Skip — Patric will bring everything tomorrow
            </button>
          </Card>
        )}

        {photo && (
          <Card className="bg-zinc-900/60 border-zinc-800 p-5 md:p-8 backdrop-blur">
            <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-center">
              {/* Phone preview of "magic" */}
              <div className="relative mx-auto">
                <div className="absolute -inset-6 bg-orange-500/30 blur-3xl rounded-full -z-10" />
                <div className="relative w-[240px] h-[500px] md:w-[280px] md:h-[580px] rounded-[2.5rem] bg-zinc-900 border-[8px] md:border-[10px] border-zinc-800 shadow-2xl shadow-orange-500/20 overflow-hidden mx-auto">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-zinc-950 rounded-b-xl z-30" />
                  {photo.url.match(/video/) ? (
                    <video src={photo.url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                  ) : (
                    <img src={photo.url} alt="dish" className="w-full h-full object-cover" />
                  )}
                  {processing && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center flex-col gap-3">
                      <div className="w-12 h-12 rounded-full border-4 border-orange-500/30 border-t-orange-500 animate-spin" />
                      <div className="text-sm font-medium text-orange-400">Cinematizing…</div>
                    </div>
                  )}
                  {done && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30" />
                      <div className="absolute top-8 left-0 right-0 px-3 flex justify-between text-[10px] text-white/70">
                        <img src="https://customer-assets.emergentagent.com/wingman/6e978d7c-1e64-42c4-b4ae-a71d4297a51c/attachments/b2e12e6cc719455bbc9b633b05df069b_image.png" alt="FoodLens" className="h-3 w-auto opacity-80" />
                        <span>LIVE</span>
                      </div>
                      <div className="absolute bottom-4 left-3 right-3 text-white animate-fade-up">
                        <Badge className="bg-orange-500 text-white border-0 mb-2 text-[10px]">Chef's Pick</Badge>
                        <div className="text-base md:text-lg font-bold">Your Hero Dish</div>
                        <div className="text-[10px] text-white/70 mt-0.5">Tap to order • Auto-translated</div>
                        <div className="flex items-center gap-1 text-yellow-400 text-[11px] mt-2">
                          <Star size={11} fill="currentColor" /> 4.9 • Trending
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div>
                {processing && (
                  <>
                    <Badge variant="outline" className="border-orange-500/40 bg-orange-500/10 text-orange-300 mb-3 text-xs">
                      <Wand2 size={12} className="mr-1.5" /> Working the magic
                    </Badge>
                    <h3 className="text-2xl md:text-3xl font-bold">Adding cinema polish…</h3>
                    <ul className="mt-4 space-y-2 text-sm md:text-base text-zinc-400">
                      <li className="flex gap-2"><span className="text-orange-500">•</span> Color grading for appetite</li>
                      <li className="flex gap-2"><span className="text-orange-500">•</span> Auto-captioning in 12 languages</li>
                      <li className="flex gap-2"><span className="text-orange-500">•</span> Pricing & order CTA overlay</li>
                    </ul>
                  </>
                )}
                {done && (
                  <>
                    <Badge variant="outline" className="border-orange-500/40 bg-orange-500/10 text-orange-300 mb-3 text-xs">
                      <Sparkles size={12} className="mr-1.5" /> That's the magic
                    </Badge>
                    <h3 className="text-2xl md:text-3xl font-bold leading-tight">
                      That dish is now <span className="text-gradient-orange">selling itself</span>.
                    </h3>
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="glass rounded-xl p-4">
                        <TrendingUp size={18} className="text-orange-400 mb-1.5" />
                        <div className="text-2xl md:text-3xl font-bold">+38%</div>
                        <div className="text-[10px] uppercase tracking-wider text-zinc-500 mt-0.5">Avg cart value</div>
                      </div>
                      <div className="glass rounded-xl p-4">
                        <Star size={18} className="text-orange-400 mb-1.5" />
                        <div className="text-2xl md:text-3xl font-bold">2.4×</div>
                        <div className="text-[10px] uppercase tracking-wider text-zinc-500 mt-0.5">Time on menu</div>
                      </div>
                    </div>
                    <p className="mt-5 text-sm md:text-base text-zinc-400">
                      We'll send Patric tomorrow to film your full menu like this. Free for 30 days.
                    </p>
                    <Button
                      onClick={() => router.push('/?signed=1')}
                      className="tap-scale tablet-btn-lg mt-6 w-full bg-orange-500 hover:bg-orange-600 text-white glow-orange"
                    >
                      Done — Send Patric My Way <ArrowRight size={18} className="ml-2" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        )}
      </section>
    </main>
  )
}

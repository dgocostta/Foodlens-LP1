'use client'

import { useState, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Upload, ArrowRight, Sparkles, Check, Camera, Video, Copy, FileText,
  Instagram, PartyPopper, Wand2,
} from 'lucide-react'
import { Logo } from '@/components/logo'
import { uploadLeadFile, uploadLeadMenuFile } from '@/lib/upload'

function OnboardingInner() {
  const search = useSearchParams()
  const router = useRouter()
  const restaurantName = search.get('r') || 'Your restaurant'
  const ownerFirst = (search.get('o') || '').split(' ')[0] || 'there'
  const leadId = search.get('id') || ''

  const [media, setMedia] = useState(null) // { url, isVideo }
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState(false)
  const photoRef = useRef(null)
  const videoRef = useRef(null)
  const menuRef = useRef(null)
  const [menuCount, setMenuCount] = useState(0)
  const [uploadingMenu, setUploadingMenu] = useState(false)

  const upload = async (file) => {
    if (!file) return
    const isVideo = /^video\//.test(file.type)
    setMedia({ url: URL.createObjectURL(file), isVideo })
    setUploading(true)

    if (!leadId) {
      toast.error("Couldn't link this to your signup. Please go back and submit the form again.")
      setUploading(false)
      return
    }
    try {
      await uploadLeadFile(leadId, file)
      setUploading(false)
      setDone(true)
      toast.success('Got it — your dish is in.')
    } catch (err) {
      setUploading(false)
      toast.error(err.message || 'Upload failed. Please try again.')
    }
  }

  const uploadMenu = async (files) => {
    const list = Array.from(files || [])
    if (!list.length) return
    if (!leadId) { toast.error("Couldn't link this to your signup."); return }
    setUploadingMenu(true)
    try {
      for (const f of list) { await uploadLeadMenuFile(leadId, f); setMenuCount((n) => n + 1) }
      toast.success('Menu received — thank you!')
    } catch (err) {
      toast.error(err.message || 'Menu upload failed.')
    } finally {
      setUploadingMenu(false)
    }
  }

  // ---- Branded, ready-to-paste social caption ----
  const tag = restaurantName.replace(/[^A-Za-z0-9]/g, '') || 'OurMenu'
  const caption =
    `We're going cinematic! 🎬\n\n` +
    `${restaurantName} is bringing the menu to life with FoodLens — every dish as a mouth-watering video you can almost taste. 👀🍽️\n\n` +
    `Come hungry. Order with your eyes.\n\n` +
    `#FoodLens #${tag} #CinemaMenu #FoodReels #EatWithYourEyes`

  const copyCaption = async () => {
    try {
      await navigator.clipboard.writeText(caption)
      toast.success('Caption copied — paste it into your post.')
    } catch {
      toast.error('Could not copy. Long-press the text to copy it.')
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 relative overflow-x-hidden">
      <div className="absolute top-0 -left-40 w-[600px] h-[600px] bg-orange-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <nav className="relative glass">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size="sm" />
            <Badge variant="outline" className="ml-1 border-orange-500/40 text-orange-400 text-[10px] md:text-xs">
              {done ? 'YOU’RE IN' : 'INSTANT PREVIEW'}
            </Badge>
          </div>
          {!done && (
            <button onClick={() => setDone(true)} className="text-xs md:text-sm text-zinc-500 hover:text-orange-400">
              Skip for now →
            </button>
          )}
        </div>
      </nav>

      {!done ? (
        // ---------- UPLOAD STEP ----------
        <section className="relative max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-10 md:py-16">
          <div className="text-center mb-8 md:mb-12">
            <Badge variant="outline" className="border-orange-500/40 bg-orange-500/10 text-orange-300 mb-4 text-sm py-1.5 px-3">
              <Check size={14} className="mr-1.5 text-orange-400" /> {restaurantName} is locked in
            </Badge>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.05] text-balance">
              One last thing, <span className="text-gradient-orange">{ownerFirst}</span> — for the instant experience.
            </h1>
            <p className="mt-4 md:mt-6 text-base md:text-xl text-zinc-400 max-w-xl mx-auto">
              Pick the one dish you'd most love to see come alive. Add a photo and we'll craft your cinema clip — or
              drop a video and watch it play right here.
            </p>
          </div>

          <Card className="bg-zinc-900/60 border-zinc-800 p-6 md:p-10 backdrop-blur">
            <input ref={photoRef} type="file" accept="image/*" onChange={(e) => upload(e.target.files?.[0])} className="hidden" />
            <input ref={videoRef} type="file" accept="video/*" onChange={(e) => upload(e.target.files?.[0])} className="hidden" />

            <div className="grid sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => photoRef.current?.click()}
                disabled={uploading}
                className="tap-scale border-2 border-dashed border-zinc-700 hover:border-orange-500 hover:bg-orange-500/5 transition rounded-3xl p-8 md:p-10 text-center group disabled:opacity-50"
              >
                <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-500/15 flex items-center justify-center mb-3 group-hover:bg-orange-500/25 transition">
                  <Camera size={26} className="text-orange-400" />
                </div>
                <div className="text-base md:text-lg font-bold text-zinc-100">Add a dish photo</div>
                <div className="text-xs md:text-sm text-zinc-500 mt-1">We'll turn it into your cinema clip.</div>
              </button>

              <button
                type="button"
                onClick={() => videoRef.current?.click()}
                disabled={uploading}
                className="tap-scale border-2 border-dashed border-zinc-700 hover:border-orange-500 hover:bg-orange-500/5 transition rounded-3xl p-8 md:p-10 text-center group disabled:opacity-50"
              >
                <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-500/15 flex items-center justify-center mb-3 group-hover:bg-orange-500/25 transition">
                  <Video size={26} className="text-orange-400" />
                </div>
                <div className="text-base md:text-lg font-bold text-zinc-100">Upload a video</div>
                <div className="text-xs md:text-sm text-zinc-500 mt-1">Plays instantly in the preview.</div>
              </button>
            </div>

            {uploading && (
              <div className="mt-6 flex items-center justify-center gap-3 text-orange-400">
                <div className="w-5 h-5 rounded-full border-2 border-orange-500/30 border-t-orange-500 animate-spin" />
                <span className="text-sm font-medium">Uploading…</span>
              </div>
            )}

            <div className="mt-4">
              <input ref={menuRef} type="file" accept="image/*,application/pdf" multiple onChange={(e) => uploadMenu(e.target.files)} className="hidden" />
              <button type="button" onClick={() => menuRef.current?.click()} disabled={uploadingMenu}
                className="tap-scale w-full border-2 border-dashed border-zinc-800 hover:border-orange-500 hover:bg-orange-500/5 transition rounded-2xl p-5 text-center group disabled:opacity-50">
                <div className="flex items-center justify-center gap-2 text-zinc-300">
                  <FileText size={18} className="text-orange-400" />
                  <span className="text-sm font-semibold">{uploadingMenu ? 'Uploading…' : 'Also have your current menu? Add a photo or PDF'}</span>
                </div>
                {menuCount > 0 && <div className="text-xs text-zinc-500 mt-1">{menuCount} menu file{menuCount === 1 ? '' : 's'} added — thank you!</div>}
              </button>
            </div>

            <p className="mt-6 text-center text-xs text-zinc-500">
              Optional — you can do this anytime. Your spot is already saved.
            </p>
          </Card>
        </section>
      ) : (
        // ---------- THANK YOU + SHARE STEP ----------
        <section className="relative max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-10 md:py-16">
          <div className="text-center mb-8 md:mb-10">
            <Badge variant="outline" className="border-orange-500/40 bg-orange-500/10 text-orange-300 mb-4 text-sm py-1.5 px-3">
              <PartyPopper size={14} className="mr-1.5 text-orange-400" /> You're on the list
            </Badge>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.05] text-balance">
              You're all set, <span className="text-gradient-orange">{ownerFirst}</span>.
            </h1>
            <p className="mt-4 md:mt-6 text-base md:text-xl text-zinc-400 max-w-xl mx-auto">
              {media
                ? "Your dish is in. We're crafting your FoodLens preview — we'll be in touch shortly. While you wait, tell your followers what's coming."
                : "You're in the pipeline — we'll be in touch shortly. While you wait, tell your followers what's coming."}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-start">
            {/* Phone preview */}
            <div className="relative mx-auto">
              <div className="absolute -inset-6 bg-orange-500/30 blur-3xl rounded-full -z-10" />
              <div className="relative w-[240px] h-[500px] md:w-[280px] md:h-[580px] rounded-[2.5rem] bg-zinc-900 border-[8px] md:border-[10px] border-zinc-800 shadow-2xl shadow-orange-500/20 overflow-hidden mx-auto">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-zinc-950 rounded-b-xl z-30" />
                {media ? (
                  media.isVideo ? (
                    <video src={media.url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                  ) : (
                    <img src={media.url} alt="your dish" className="w-full h-full object-cover" />
                  )
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-zinc-500 px-6 text-center">
                    <Wand2 size={28} className="text-orange-400" />
                    <span className="text-sm">Your cinema clip will live here.</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-3 right-3 text-white">
                  <Badge className="bg-orange-500 text-white border-0 mb-2 text-[10px]">Coming soon</Badge>
                  <div className="text-base md:text-lg font-bold">{restaurantName}</div>
                  <div className="text-[10px] text-white/70 mt-0.5">Powered by FoodLens</div>
                </div>
              </div>
            </div>

            {/* Share card */}
            <Card className="bg-zinc-900/60 border-zinc-800 p-5 md:p-7 backdrop-blur">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-orange-400" />
                <h3 className="text-lg md:text-xl font-bold">Share the news</h3>
              </div>
              <p className="text-sm text-zinc-400 mb-4">
                Here's a ready-to-go post. Copy it, then open your app and paste.
              </p>

              <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-4 text-sm text-zinc-300 whitespace-pre-line leading-relaxed">
                {caption}
              </div>

              <Button onClick={copyCaption} className="tap-scale mt-4 w-full bg-orange-500 hover:bg-orange-600 text-white">
                <Copy size={16} className="mr-2" /> Copy caption
              </Button>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <a href="https://www.instagram.com/" target="_blank" rel="noreferrer"
                   className="tap-scale glass rounded-xl py-3 text-center text-xs text-zinc-300 hover:text-white flex flex-col items-center gap-1">
                  <Instagram size={16} className="text-orange-400" /> Instagram
                </a>
                <a href="https://www.tiktok.com/upload" target="_blank" rel="noreferrer"
                   className="tap-scale glass rounded-xl py-3 text-center text-xs text-zinc-300 hover:text-white flex flex-col items-center gap-1">
                  <Video size={16} className="text-orange-400" /> TikTok
                </a>
                <a href="https://www.facebook.com/" target="_blank" rel="noreferrer"
                   className="tap-scale glass rounded-xl py-3 text-center text-xs text-zinc-300 hover:text-white flex flex-col items-center gap-1">
                  <Sparkles size={16} className="text-orange-400" /> Facebook
                </a>
              </div>

              <button onClick={() => router.push('/')} className="tap-scale mt-5 w-full text-zinc-400 hover:text-white text-sm flex items-center justify-center gap-2 py-2">
                Back to home <ArrowRight size={15} />
              </button>
            </Card>
          </div>
        </section>
      )}
    </main>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingInner />
    </Suspense>
  )
}

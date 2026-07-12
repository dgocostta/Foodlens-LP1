'use client'

// Lead Bank — admin tab. Cold scraped prospects (Firestore `leadBank`),
// browsable/filterable, bulk-assignable to affiliates. Fed by the scraper
// import endpoint, CSV/JSON upload, and manual add. See LEAD_BANK_BUILD_PROMPT.md.

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Database, RefreshCw, Upload, Plus, X, Search, Star, Phone, Globe, Mail,
  MapPin, ExternalLink, MessageCircle, Trash2, Users, Sparkles, Tag, Copy,
  ChevronDown, ChevronRight, FileUp, CheckSquare,
} from 'lucide-react'
import { toast } from 'sonner'

const BANK_STATUSES = ['new', 'contacted', 'interested', 'not_interested', 'converted']
const BANK_LABELS = {
  new: 'New', contacted: 'Contacted', interested: 'Interested',
  not_interested: 'Not interested', converted: 'Converted',
}
const BANK_STYLES = {
  new: 'border-zinc-600 text-zinc-300',
  contacted: 'border-amber-500/50 text-amber-300',
  interested: 'border-orange-500/50 text-orange-300',
  not_interested: 'border-red-500/50 text-red-300',
  converted: 'border-green-500/50 text-green-300',
}

const BankStatusBadge = ({ status }) => {
  const s = BANK_STATUSES.includes(status) ? status : 'new'
  return <Badge variant="outline" className={`${BANK_STYLES[s]} whitespace-nowrap`}>{BANK_LABELS[s]}</Badge>
}

const KpiCard = ({ icon: Icon, label, value }) => (
  <Card className="bg-zinc-900/60 border-zinc-800 p-4">
    <div className="flex items-center justify-between">
      <Icon size={16} className="text-orange-400" />
      <span className="text-2xl font-bold">{value}</span>
    </div>
    <div className="text-xs text-zinc-500 mt-1 uppercase tracking-wider">{label}</div>
  </Card>
)

// ---- CSV / JSON parsing + header auto-map (Apify export or xlsx-derived CSV) ----

const HEADER_MAP = {
  restaurant: 'restaurant', name: 'restaurant', title: 'restaurant',
  cuisine: 'cuisine', category: 'cuisine', categoryname: 'cuisine',
  'cuisine group': 'cuisineGroup', cuisinegroup: 'cuisineGroup',
  'service type': 'serviceType', servicetype: 'serviceType',
  'dine-in': 'dineIn', dinein: 'dineIn',
  takeaway: 'takeaway', delivery: 'delivery', price: 'price',
  rating: 'rating', totalscore: 'rating',
  reviews: 'reviews', reviewscount: 'reviews',
  phone: 'phone', website: 'website', email: 'email', emails: 'email',
  instagram: 'instagram', facebook: 'facebook',
  'area / district': 'area', area: 'area', district: 'area', neighborhood: 'area',
  address: 'address', 'google maps': 'googleMaps', googlemaps: 'googleMaps', url: 'googleMaps',
  status: 'status', owner: 'assignedName',
  'last contacted': 'lastContacted', lastcontacted: 'lastContacted',
  'next follow-up': 'nextFollowup', 'next followup': 'nextFollowup', nextfollowup: 'nextFollowup',
  notes: 'notes', placeid: 'placeId', 'place id': 'placeId', city: 'city', country: 'country',
}
const CANONICAL_FIELDS = new Set(Object.values(HEADER_MAP))
const mapHeader = (h) => {
  const key = String(h || '').trim().toLowerCase()
  return HEADER_MAP[key] || (CANONICAL_FIELDS.has(String(h || '').trim()) ? String(h).trim() : null)
}

function parseCsv(text) {
  const rows = []
  let row = []
  let cur = ''
  let inQ = false
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cur += '"'; i += 1 } else inQ = false
      } else cur += ch
    } else if (ch === '"') inQ = true
    else if (ch === ',') { row.push(cur); cur = '' }
    else if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = '' }
    else if (ch !== '\r') cur += ch
  }
  if (cur.length || row.length) { row.push(cur); rows.push(row) }
  return rows.filter((r) => r.some((c) => String(c).trim() !== ''))
}

// -> { records, mappedHeaders, ignoredHeaders }
function parseImportFile(text, isJson) {
  if (isJson || /^\s*[\[{]/.test(text)) {
    const data = JSON.parse(text)
    const arr = Array.isArray(data) ? data : (Array.isArray(data?.leads) ? data.leads : [])
    const records = arr.map((obj) => {
      const out = {}
      Object.entries(obj || {}).forEach(([k, v]) => {
        const f = mapHeader(k)
        if (f && v != null && v !== '') out[f] = v
      })
      return out
    }).filter((r) => r.restaurant || r.placeId)
    return { records, mappedHeaders: [], ignoredHeaders: [] }
  }
  const rows = parseCsv(text)
  if (rows.length < 2) return { records: [], mappedHeaders: [], ignoredHeaders: [] }
  const headers = rows[0]
  const fields = headers.map(mapHeader)
  const mappedHeaders = headers.filter((h, i) => fields[i])
  const ignoredHeaders = headers.filter((h, i) => !fields[i])
  const records = rows.slice(1).map((cells) => {
    const out = {}
    fields.forEach((f, i) => {
      const v = String(cells[i] ?? '').trim()
      if (f && v) out[f] = v
    })
    return out
  }).filter((r) => r.restaurant || r.placeId)
  return { records, mappedHeaders, ignoredHeaders }
}

const httpUrl = (u) => (/^https?:\/\//i.test(u || '') ? u : u ? `https://${u}` : '')
const fmtDate = (v) => {
  if (!v) return '—'
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString()
}

const RAIL_SELECT = 'w-full bg-zinc-900 border border-zinc-800 rounded-lg text-xs px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500'

const FilterSelect = ({ label, value, onChange, children }) => (
  <div>
    <div className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1">{label}</div>
    <select value={value} onChange={(e) => onChange(e.target.value)} className={RAIL_SELECT}>
      {children}
    </select>
  </div>
)

const EMPTY_FILTERS = { country: '', city: '', cuisine: '', area: '', status: '', assigned: '', ratingMin: '', batchId: '' }

export function LeadBankTab({ adminKey }) {
  const [facets, setFacets] = useState(null)
  const [items, setItems] = useState([])
  const [nextCursor, setNextCursor] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(() => new Set())
  const [allInFilter, setAllInFilter] = useState(false)
  const [detail, setDetail] = useState(null)
  const [showImport, setShowImport] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [affiliates, setAffiliates] = useState([])
  const [bulkAssign, setBulkAssign] = useState('')
  const [bulkStatus, setBulkStatus] = useState('')
  const [bulkBusy, setBulkBusy] = useState(false)

  const headers = { 'X-Admin-Key': adminKey }

  const queryString = useCallback((extra = {}) => {
    const p = new URLSearchParams()
    Object.entries({ ...filters, q: search, ...extra }).forEach(([k, v]) => {
      if (v !== '' && v != null) p.set(k, v)
    })
    return p.toString()
  }, [filters, search])

  const loadFacets = useCallback(async () => {
    try {
      const res = await fetch('/api/lead-bank/facets', { headers })
      const data = await res.json().catch(() => ({}))
      if (res.ok) setFacets(data)
    } catch (e) { /* non-fatal */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminKey])

  const loadList = useCallback(async (reset = true, cursor = null) => {
    reset ? setLoading(true) : setLoadingMore(true)
    try {
      const qs = queryString(cursor ? { cursor, limit: 100 } : { limit: 100 })
      const res = await fetch(`/api/lead-bank?${qs}`, { headers })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to load lead bank')
      setItems((arr) => (reset ? data.items || [] : [...arr, ...(data.items || [])]))
      setNextCursor(data.nextCursor || null)
      if (reset) { setSelected(new Set()); setAllInFilter(false) }
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString, adminKey])

  const loadAffiliates = useCallback(async () => {
    try {
      const res = await fetch('/api/affiliates', { headers })
      const data = await res.json().catch(() => ({}))
      setAffiliates((data.affiliates || []).filter((a) => a.status === 'approved' && a.code))
    } catch (e) { /* non-fatal */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminKey])

  useEffect(() => { loadFacets(); loadAffiliates() }, [loadFacets, loadAffiliates])

  // Debounced reload on filter/search changes.
  useEffect(() => {
    const t = setTimeout(() => loadList(true), 350)
    return () => clearTimeout(t)
  }, [loadList])

  const refresh = () => { loadFacets(); loadList(true) }

  const patchRow = async (id, body) => {
    const res = await fetch(`/api/lead-bank/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'Update failed')
    setItems((arr) => arr.map((x) => (x.id === id ? { ...x, ...data.item } : x)))
    setDetail((d) => (d && d.id === id ? { ...d, ...data.item } : d))
    return data.item
  }

  const toggleSelect = (id) => {
    setAllInFilter(false)
    setSelected((s) => {
      const next = new Set(s)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  const togglePage = () => {
    setAllInFilter(false)
    setSelected((s) => (s.size === items.length ? new Set() : new Set(items.map((x) => x.id))))
  }
  const clearSelection = () => { setSelected(new Set()); setAllInFilter(false) }

  const runBulk = async (action, value) => {
    if (!allInFilter && selected.size === 0) return
    if (action === 'delete') {
      const what = allInFilter ? 'ALL prospects matching the current filter' : `${selected.size} selected prospect(s)`
      if (!window.confirm(`Delete ${what}? This can't be undone.`)) return
    }
    setBulkBusy(true)
    try {
      const body = { action, value }
      if (allInFilter) body.filter = { ...filters, q: search }
      else body.ids = Array.from(selected)
      const res = await fetch('/api/lead-bank/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Bulk action failed')
      toast.success(
        action === 'assign'
          ? (value ? `${data.count} assigned to ${value}` : `${data.count} unassigned`)
          : action === 'status'
            ? `${data.count} set to "${BANK_LABELS[value] || value}"`
            : `${data.count} deleted`,
      )
      clearSelection()
      refresh()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBulkBusy(false)
    }
  }

  // Country → City nav derived from facets.
  const countries = Object.entries(facets?.countries || {}).sort((a, b) => b[1] - a[1])
  const citiesByCountry = {}
  Object.entries(facets?.cities || {}).forEach(([city, count]) => {
    const country = facets?.cityCountry?.[city] || 'Other'
    ;(citiesByCountry[country] = citiesByCountry[country] || []).push([city, count])
  })
  Object.values(citiesByCountry).forEach((list) => list.sort((a, b) => b[1] - a[1]))

  const setF = (k) => (v) => setFilters((f) => ({ ...f, [k]: v }))
  const hasFilters = search || Object.values(filters).some(Boolean)
  const selectionCount = allInFilter ? 'all matching' : selected.size

  return (
    <div>
      <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Database size={18} className="text-orange-400" />
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Lead Bank</h1>
          </div>
          <p className="text-zinc-500 text-sm md:text-base">Cold prospects from the scraper — filter, label, and assign them to affiliates.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setShowAdd(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
            <Plus size={14} className="mr-1.5" /> Add prospect
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowImport(true)} className="border-zinc-800">
            <Upload size={13} className="mr-1.5" /> Import CSV/JSON
          </Button>
          <Button size="sm" variant="outline" onClick={refresh} className="border-zinc-800">
            <RefreshCw size={13} className={`mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard icon={Database} label="Total" value={facets?.total ?? '—'} />
        <KpiCard icon={Sparkles} label="New" value={facets?.new ?? '—'} />
        <KpiCard icon={Users} label="Assigned" value={facets?.assigned ?? '—'} />
        <KpiCard icon={MapPin} label="Cities" value={facets ? Object.keys(facets.cities || {}).length : '—'} />
      </div>

      <div className="lg:flex lg:gap-5 items-start">
        {/* Left rail: location nav + filters */}
        <aside className="lg:w-56 lg:flex-shrink-0 mb-4 lg:mb-0 space-y-4">
          <Card className="bg-zinc-900/60 border-zinc-800 p-3">
            <div className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1.5">Location</div>
            <button onClick={() => setFilters((f) => ({ ...f, country: '', city: '' }))}
              className={`w-full text-left text-xs px-2 py-1.5 rounded-lg flex items-center justify-between ${!filters.country && !filters.city ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>
              <span>All locations</span><span className="opacity-70">{facets?.total ?? ''}</span>
            </button>
            {countries.map(([country, count]) => {
              const open = filters.country === country || !filters.country
              return (
                <div key={country}>
                  <button onClick={() => setFilters((f) => ({ ...f, country: f.country === country && !f.city ? '' : country, city: '' }))}
                    className={`w-full text-left text-xs px-2 py-1.5 rounded-lg flex items-center justify-between ${filters.country === country && !filters.city ? 'bg-orange-500 text-white' : 'text-zinc-300 hover:text-white hover:bg-white/5'}`}>
                    <span className="flex items-center gap-1 font-medium">
                      {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />} {country}
                    </span>
                    <span className="opacity-70">{count}</span>
                  </button>
                  {open && (citiesByCountry[country] || []).map(([city, cCount]) => (
                    <button key={city} onClick={() => setFilters((f) => ({ ...f, country, city: f.city === city ? '' : city }))}
                      className={`w-full text-left text-xs pl-6 pr-2 py-1 rounded-lg flex items-center justify-between ${filters.city === city ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>
                      <span>{city}</span><span className="opacity-70">{cCount}</span>
                    </button>
                  ))}
                </div>
              )
            })}
          </Card>

          <Card className="bg-zinc-900/60 border-zinc-800 p-3 space-y-3">
            <FilterSelect label="Status" value={filters.status} onChange={setF('status')}>
              <option value="">All statuses</option>
              {BANK_STATUSES.map((s) => <option key={s} value={s}>{BANK_LABELS[s]}{facets?.statuses?.[s] ? ` (${facets.statuses[s]})` : ''}</option>)}
            </FilterSelect>
            <FilterSelect label="Assigned" value={filters.assigned} onChange={setF('assigned')}>
              <option value="">Anyone / no one</option>
              <option value="no">Unassigned</option>
              <option value="yes">Assigned (any)</option>
              {affiliates.map((a) => <option key={a.code} value={a.code}>{a.name} ({a.code})</option>)}
            </FilterSelect>
            <FilterSelect label="Cuisine" value={filters.cuisine} onChange={setF('cuisine')}>
              <option value="">All cuisines</option>
              {Object.entries(facets?.cuisines || {}).sort((a, b) => b[1] - a[1]).map(([c, n]) => <option key={c} value={c}>{c} ({n})</option>)}
            </FilterSelect>
            <FilterSelect label="Area" value={filters.area} onChange={setF('area')}>
              <option value="">All areas</option>
              {Object.entries(facets?.areas || {}).sort((a, b) => b[1] - a[1]).map(([a, n]) => <option key={a} value={a}>{a} ({n})</option>)}
            </FilterSelect>
            <FilterSelect label="Min rating" value={filters.ratingMin} onChange={setF('ratingMin')}>
              <option value="">Any rating</option>
              {['3', '3.5', '4', '4.5'].map((r) => <option key={r} value={r}>{r}+ ★</option>)}
            </FilterSelect>
            <FilterSelect label="Import batch" value={filters.batchId} onChange={setF('batchId')}>
              <option value="">All batches</option>
              {(facets?.batches || []).map((b, i) => (
                <option key={b.batchId} value={b.batchId}>
                  {i === 0 ? '⭐ Newest — ' : ''}{b.source} · {b.city || b.country || '—'} · {fmtDate(b.createdAt)} ({b.inserted})
                </option>
              ))}
            </FilterSelect>
            {hasFilters && (
              <button onClick={() => { setFilters(EMPTY_FILTERS); setSearch('') }}
                className="w-full text-xs text-zinc-500 hover:text-orange-400 py-1">Clear all filters</button>
            )}
          </Card>
        </aside>

        {/* Main: search + bulk toolbar + table */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, address, email, phone…"
                className="bg-zinc-900 border-zinc-800 pl-9 h-9 text-sm" />
            </div>
            <span className="text-xs text-zinc-500 flex-shrink-0">{items.length} shown{nextCursor ? '+' : ''}</span>
          </div>

          {(selected.size > 0 || allInFilter) && (
            <Card className="bg-zinc-900 border-orange-500/40 p-3 mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-orange-300 flex items-center gap-1.5">
                  <CheckSquare size={13} /> {allInFilter ? 'All in filter' : `${selectionCount} selected`}
                </span>
                {!allInFilter && selected.size === items.length && (nextCursor || hasFilters) && (
                  <button onClick={() => setAllInFilter(true)} className="text-xs text-orange-400 hover:underline">
                    Select all matching filter →
                  </button>
                )}
                <span className="flex-1" />
                <select value={bulkAssign} onChange={(e) => setBulkAssign(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg text-xs px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500">
                  <option value="">Assign to…</option>
                  {affiliates.map((a) => <option key={a.code} value={a.code}>{a.name} ({a.code})</option>)}
                  <option value="__unassign__">— Unassign —</option>
                </select>
                <Button size="sm" disabled={bulkBusy || !bulkAssign}
                  onClick={() => runBulk('assign', bulkAssign === '__unassign__' ? '' : bulkAssign)}
                  className="bg-orange-500 hover:bg-orange-600 text-white h-8 text-xs">Assign</Button>
                <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg text-xs px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500">
                  <option value="">Set status…</option>
                  {BANK_STATUSES.map((s) => <option key={s} value={s}>{BANK_LABELS[s]}</option>)}
                </select>
                <Button size="sm" variant="outline" disabled={bulkBusy || !bulkStatus}
                  onClick={() => runBulk('status', bulkStatus)} className="border-zinc-700 h-8 text-xs">Apply</Button>
                <Button size="sm" variant="outline" disabled={bulkBusy} onClick={() => runBulk('delete')}
                  className="border-red-500/40 text-red-300 hover:bg-red-500/10 h-8 text-xs"><Trash2 size={12} className="mr-1" /> Delete</Button>
                <button onClick={clearSelection} className="text-xs text-zinc-500 hover:text-white px-1"><X size={14} /></button>
              </div>
            </Card>
          )}

          <Card className="bg-zinc-900/60 border-zinc-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-950/80 text-zinc-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-2.5 w-8">
                      <input type="checkbox" checked={items.length > 0 && selected.size === items.length}
                        onChange={togglePage} className="accent-orange-500" />
                    </th>
                    <th className="text-left px-3 py-2.5">Restaurant</th>
                    <th className="text-left px-3 py-2.5">Cuisine</th>
                    <th className="text-left px-3 py-2.5">Area</th>
                    <th className="text-left px-3 py-2.5">Rating</th>
                    <th className="text-left px-3 py-2.5">Phone</th>
                    <th className="text-left px-3 py-2.5">Web</th>
                    <th className="text-left px-3 py-2.5">Status</th>
                    <th className="text-left px-3 py-2.5">Assigned to</th>
                    <th className="text-left px-3 py-2.5">Last contact</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && items.length === 0 && (
                    <tr><td colSpan={10} className="px-4 py-12 text-center text-zinc-500">Loading…</td></tr>
                  )}
                  {!loading && items.length === 0 && (
                    <tr><td colSpan={10} className="px-4 py-12 text-center text-zinc-500">
                      No prospects{hasFilters ? ' match these filters' : ' yet — import a scrape or add one manually'}.
                    </td></tr>
                  )}
                  {items.map((x) => (
                    <tr key={x.id} onClick={() => setDetail(x)}
                      className={`border-t border-zinc-800 hover:bg-white/[0.03] cursor-pointer ${selected.has(x.id) ? 'bg-orange-500/[0.06]' : ''}`}>
                      <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selected.has(x.id)} onChange={() => toggleSelect(x.id)} className="accent-orange-500" />
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-medium leading-tight">{x.restaurant || '—'}</div>
                        {x.address && <div className="text-[11px] text-zinc-600 truncate max-w-[220px]">{x.address}</div>}
                      </td>
                      <td className="px-3 py-2 text-zinc-400 whitespace-nowrap">{x.cuisine || '—'}</td>
                      <td className="px-3 py-2 text-zinc-400 whitespace-nowrap">{x.area || '—'}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {x.rating ? (
                          <span className="inline-flex items-center gap-1 text-zinc-300">
                            <Star size={11} className="text-orange-400 fill-orange-400" /> {x.rating}
                            {x.reviews ? <span className="text-zinc-600 text-xs">({x.reviews})</span> : null}
                          </span>
                        ) : <span className="text-zinc-600">—</span>}
                      </td>
                      <td className="px-3 py-2 text-zinc-400 whitespace-nowrap text-xs">{x.phone || '—'}</td>
                      <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                        {x.website ? (
                          <a href={httpUrl(x.website)} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-orange-400"><Globe size={14} /></a>
                        ) : <span className="text-zinc-700">—</span>}
                      </td>
                      <td className="px-3 py-2"><BankStatusBadge status={x.status} /></td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {x.assignedName
                          ? <span className="inline-flex items-center gap-1.5 text-orange-300 text-xs"><Users size={11} /> {x.assignedName}</span>
                          : <span className="text-zinc-600 text-xs">—</span>}
                      </td>
                      <td className="px-3 py-2 text-zinc-500 text-xs whitespace-nowrap">{x.lastContacted ? fmtDate(x.lastContacted) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {nextCursor && (
            <div className="text-center mt-4">
              <Button size="sm" variant="outline" disabled={loadingMore}
                onClick={() => loadList(false, nextCursor)} className="border-zinc-800">
                {loadingMore ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {detail && (
        <BankDetail item={detail} affiliates={affiliates} onClose={() => setDetail(null)} onPatch={patchRow} />
      )}
      {showImport && (
        <ImportModal adminKey={adminKey} defaults={{ city: filters.city, country: filters.country }}
          onClose={() => setShowImport(false)}
          onDone={() => { setShowImport(false); refresh() }} />
      )}
      {showAdd && (
        <AddProspectModal adminKey={adminKey} defaults={{ city: filters.city, country: filters.country }}
          onClose={() => setShowAdd(false)}
          onDone={() => { setShowAdd(false); refresh() }} />
      )}
    </div>
  )
}

const DetailRow = ({ label, value, href }) => (
  <div className="flex items-start justify-between gap-3 text-sm py-1.5 border-b border-zinc-900 last:border-0">
    <span className="text-zinc-500 text-xs uppercase tracking-wide flex-shrink-0 pt-0.5">{label}</span>
    {href ? (
      <a href={href} target="_blank" rel="noreferrer" className="text-orange-400 hover:underline text-right break-all">{value}</a>
    ) : (
      <span className="text-zinc-300 text-right break-words min-w-0">{value || '—'}</span>
    )}
  </div>
)

const BankDetail = ({ item, affiliates, onClose, onPatch }) => {
  const [notes, setNotes] = useState(item.notes || '')
  const [busy, setBusy] = useState(false)
  const digits = (item.phone || '').replace(/[^\d]/g, '')

  const save = async (body, okMsg) => {
    setBusy(true)
    try {
      await onPatch(item.id, body)
      if (okMsg) toast.success(okMsg)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  const copy = (txt) => navigator.clipboard.writeText(txt).then(
    () => toast.success('Copied'), () => toast.error('Could not copy'))

  const dateVal = (v) => {
    if (!v) return ''
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10)
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-zinc-950 border-l border-zinc-800 h-full overflow-y-auto">
        <div className="sticky top-0 glass px-5 py-4 flex items-center justify-between border-b border-zinc-800">
          <div className="min-w-0">
            <div className="text-lg font-bold leading-tight truncate">{item.restaurant || 'Prospect'}</div>
            <div className="text-xs text-zinc-500 truncate">
              {[item.cuisine, item.area, item.city].filter(Boolean).join(' · ') || 'Lead Bank prospect'}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-6">
          {/* Status */}
          <div>
            <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Outreach status</div>
            <div className="flex flex-wrap gap-1.5">
              {BANK_STATUSES.map((s) => (
                <button key={s} disabled={busy} onClick={() => save({ status: s }, `Marked "${BANK_LABELS[s]}"`)}
                  className={`text-xs px-2.5 py-1 rounded-full border ${(item.status || 'new') === s ? 'bg-orange-500 border-orange-500 text-white' : 'border-zinc-700 text-zinc-400 hover:border-orange-500/60'}`}>
                  {BANK_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Owner */}
          <div>
            <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Assigned to</div>
            <select value={item.assignedTo || ''} disabled={busy}
              onChange={(e) => save({ assignedTo: e.target.value }, e.target.value ? 'Assigned' : 'Unassigned')}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg text-sm px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-orange-500">
              <option value="">— Unassigned —</option>
              {affiliates.map((a) => <option key={a.code} value={a.code}>{a.name} ({a.code})</option>)}
            </select>
            {item.assignedAt && <p className="text-[11px] text-zinc-600 mt-1">Assigned {new Date(item.assignedAt).toLocaleString()}</p>}
          </div>

          {/* Quick actions */}
          <div>
            <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Quick actions</div>
            <div className="flex flex-wrap gap-2">
              {item.phone && (
                <>
                  <a href={`tel:${item.phone}`}><Button size="sm" variant="outline" className="border-zinc-700 h-8 text-xs"><Phone size={12} className="mr-1.5" /> Call</Button></a>
                  <a href={`https://wa.me/${digits}`} target="_blank" rel="noreferrer"><Button size="sm" variant="outline" className="border-zinc-700 h-8 text-xs"><MessageCircle size={12} className="mr-1.5" /> WhatsApp</Button></a>
                </>
              )}
              {item.email && (
                <a href={`mailto:${item.email}`}><Button size="sm" variant="outline" className="border-zinc-700 h-8 text-xs"><Mail size={12} className="mr-1.5" /> Email</Button></a>
              )}
              {item.website && (
                <a href={httpUrl(item.website)} target="_blank" rel="noreferrer"><Button size="sm" variant="outline" className="border-zinc-700 h-8 text-xs"><Globe size={12} className="mr-1.5" /> Website</Button></a>
              )}
              {item.googleMaps && (
                <a href={httpUrl(item.googleMaps)} target="_blank" rel="noreferrer"><Button size="sm" variant="outline" className="border-zinc-700 h-8 text-xs"><MapPin size={12} className="mr-1.5" /> Maps</Button></a>
              )}
            </div>
          </div>

          {/* Follow-up dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1 block">Last contacted</Label>
              <Input type="date" defaultValue={dateVal(item.lastContacted)} disabled={busy}
                onChange={(e) => save({ lastContacted: e.target.value })}
                className="bg-zinc-900 border-zinc-800 h-9 text-xs" />
            </div>
            <div>
              <Label className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1 block">Next follow-up</Label>
              <Input type="date" defaultValue={dateVal(item.nextFollowup)} disabled={busy}
                onChange={(e) => save({ nextFollowup: e.target.value })}
                className="bg-zinc-900 border-zinc-800 h-9 text-xs" />
            </div>
          </div>

          {/* Notes */}
          <div>
            <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Notes</div>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              onBlur={() => { if (notes !== (item.notes || '')) save({ notes }, 'Notes saved') }}
              rows={3} placeholder="Outreach notes…" className="bg-zinc-900 border-zinc-800 resize-none text-sm" />
          </div>

          {/* All fields */}
          <div>
            <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Details</div>
            <Card className="bg-zinc-900/60 border-zinc-800 px-3 py-1.5">
              <DetailRow label="Rating" value={item.rating ? `★ ${item.rating} (${item.reviews || 0} reviews)` : '—'} />
              <DetailRow label="Price" value={item.price} />
              <DetailRow label="Cuisine" value={[item.cuisine, item.cuisineGroup].filter(Boolean).join(' · ')} />
              <DetailRow label="Service" value={[item.serviceType,
                item.dineIn === true || /yes|true/i.test(String(item.dineIn)) ? 'Dine-in' : '',
                item.takeaway === true || /yes|true/i.test(String(item.takeaway)) ? 'Takeaway' : '',
                item.delivery === true || /yes|true/i.test(String(item.delivery)) ? 'Delivery' : '',
              ].filter(Boolean).join(' · ')} />
              <DetailRow label="Address" value={item.address} />
              <DetailRow label="Phone" value={item.phone} />
              <DetailRow label="Email" value={item.email} href={item.email ? `mailto:${item.email}` : null} />
              <DetailRow label="Website" value={item.website} href={item.website ? httpUrl(item.website) : null} />
              <DetailRow label="Instagram" value={item.instagram} href={item.instagram ? httpUrl(item.instagram.startsWith('@') ? `instagram.com/${item.instagram.slice(1)}` : item.instagram) : null} />
              <DetailRow label="Facebook" value={item.facebook} href={item.facebook ? httpUrl(item.facebook) : null} />
            </Card>
          </div>

          <div className="text-xs text-zinc-600 border-t border-zinc-800 pt-4 space-y-0.5">
            <div className="flex items-center gap-1.5">Place ID: <span className="font-mono">{item.placeId || item.id}</span>
              <button onClick={() => copy(item.placeId || item.id)} className="hover:text-orange-400"><Copy size={11} /></button>
            </div>
            <div>Source: {item.source || '—'} · Batch: <span className="font-mono">{(item.batchId || '').slice(0, 8) || '—'}</span></div>
            <div>Imported: {item.importedAt ? new Date(item.importedAt).toLocaleString() : '—'}</div>
            {item.updatedAt && <div>Updated: {new Date(item.updatedAt).toLocaleString()}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

const ImportModal = ({ adminKey, defaults, onClose, onDone }) => {
  const [parsed, setParsed] = useState(null) // { records, mappedHeaders, ignoredHeaders, fileName }
  const [batch, setBatch] = useState({ source: 'csv-upload', city: defaults.city || '', country: defaults.country || '' })
  const [importing, setImporting] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef(null)

  const handleFile = async (file) => {
    if (!file) return
    try {
      const text = await file.text()
      const isJson = /\.json$/i.test(file.name) || file.type === 'application/json'
      const result = parseImportFile(text, isJson)
      if (!result.records.length) { toast.error('No usable rows found — need at least a Restaurant or placeId column.'); return }
      setParsed({ ...result, fileName: file.name })
      setBatch((b) => ({ ...b, source: isJson ? 'json-upload' : 'csv-upload' }))
    } catch (e) {
      toast.error(`Could not parse file: ${e.message}`)
    }
  }

  const runImport = async () => {
    if (!parsed?.records?.length) return
    setImporting(true)
    try {
      const res = await fetch('/api/lead-bank/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey },
        body: JSON.stringify({ batch, leads: parsed.records }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Import failed')
      toast.success(`Imported — ${data.inserted} new, ${data.updated} updated (deduped on placeId).`)
      onDone()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setImporting(false)
    }
  }

  const withPlaceId = (parsed?.records || []).filter((r) => r.placeId).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <Card className="relative bg-zinc-950 border-zinc-800 w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2"><FileUp size={17} className="text-orange-400" /> Import prospects</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5"><X size={18} /></button>
        </div>

        <input ref={fileRef} type="file" accept=".csv,.json,text/csv,application/json" className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])} />
        <button
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]) }}
          className={`w-full border-2 border-dashed rounded-xl p-8 text-center transition ${dragOver ? 'border-orange-500 bg-orange-500/5' : 'border-zinc-800 hover:border-zinc-600'}`}>
          <Upload size={22} className="mx-auto mb-2 text-zinc-500" />
          <div className="text-sm text-zinc-300 font-medium">{parsed ? parsed.fileName : 'Drop a CSV or JSON here'}</div>
          <div className="text-xs text-zinc-600 mt-1">
            {parsed ? 'Click to choose a different file' : 'Apify export or the xlsx-derived CSV — headers auto-map'}
          </div>
        </button>

        {parsed && (
          <>
            <div className="mt-4 text-sm text-zinc-300">
              <span className="font-semibold text-orange-300">{parsed.records.length}</span> rows parsed ·{' '}
              <span className="text-zinc-400">{withPlaceId} with placeId (dedupe key)</span>
              {withPlaceId < parsed.records.length && (
                <span className="block text-xs text-zinc-500 mt-0.5">Rows without a placeId get a generated id (no dedupe on re-import).</span>
              )}
              {parsed.ignoredHeaders.length > 0 && (
                <span className="block text-xs text-zinc-600 mt-0.5">Ignored columns: {parsed.ignoredHeaders.join(', ')}</span>
              )}
            </div>

            <div className="mt-3 border border-zinc-800 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-zinc-900 text-zinc-500 uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-2.5 py-1.5">Restaurant</th>
                    <th className="text-left px-2.5 py-1.5">Area</th>
                    <th className="text-left px-2.5 py-1.5">Phone</th>
                    <th className="text-left px-2.5 py-1.5">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.records.slice(0, 5).map((r, i) => (
                    <tr key={i} className="border-t border-zinc-800/60 text-zinc-300">
                      <td className="px-2.5 py-1.5 truncate max-w-[140px]">{r.restaurant || '—'}</td>
                      <td className="px-2.5 py-1.5 truncate max-w-[90px]">{r.area || '—'}</td>
                      <td className="px-2.5 py-1.5 whitespace-nowrap">{r.phone || '—'}</td>
                      <td className="px-2.5 py-1.5 truncate max-w-[130px]">{r.email || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsed.records.length > 5 && (
                <div className="text-[11px] text-zinc-600 px-2.5 py-1.5 border-t border-zinc-800/60">…and {parsed.records.length - 5} more</div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4">
              <div><Label className="text-zinc-300 text-xs mb-1 block">Source</Label>
                <Input value={batch.source} onChange={(e) => setBatch((b) => ({ ...b, source: e.target.value }))} className="bg-zinc-900 border-zinc-800 h-9 text-sm" /></div>
              <div><Label className="text-zinc-300 text-xs mb-1 block">City</Label>
                <Input value={batch.city} onChange={(e) => setBatch((b) => ({ ...b, city: e.target.value }))} placeholder="Dublin" className="bg-zinc-900 border-zinc-800 h-9 text-sm" /></div>
              <div><Label className="text-zinc-300 text-xs mb-1 block">Country</Label>
                <Input value={batch.country} onChange={(e) => setBatch((b) => ({ ...b, country: e.target.value }))} placeholder="Ireland" className="bg-zinc-900 border-zinc-800 h-9 text-sm" /></div>
            </div>
            <p className="text-[11px] text-zinc-600 mt-2">Upserts by placeId — existing prospects keep their status, owner, and notes; only contact/info fields refresh.</p>

            <Button onClick={runImport} disabled={importing} className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white">
              {importing ? 'Importing…' : `Import ${parsed.records.length} prospects`}
            </Button>
          </>
        )}
      </Card>
    </div>
  )
}

const AddProspectModal = ({ adminKey, defaults, onClose, onDone }) => {
  const [form, setForm] = useState({
    restaurant: '', cuisine: '', area: '', address: '', phone: '', email: '',
    website: '', instagram: '', rating: '', notes: '',
    city: defaults.city || '', country: defaults.country || '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.restaurant.trim()) { toast.error('Restaurant name is required'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/lead-bank/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey },
        body: JSON.stringify({
          batch: { source: 'manual', city: form.city, country: form.country },
          leads: [form],
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Could not add prospect')
      toast.success('Prospect added to the bank')
      onDone()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const field = (label, key, props = {}) => (
    <div>
      <Label className="text-zinc-300 text-xs mb-1 block">{label}</Label>
      <Input value={form[key]} onChange={set(key)} className="bg-zinc-900 border-zinc-800" {...props} />
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <Card className="relative bg-zinc-950 border-zinc-800 w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2"><Tag size={16} className="text-orange-400" /> Add prospect</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          {field('Restaurant *', 'restaurant')}
          <div className="grid grid-cols-2 gap-3">
            {field('Cuisine', 'cuisine')}
            {field('Area', 'area')}
          </div>
          {field('Address', 'address')}
          <div className="grid grid-cols-2 gap-3">
            {field('Phone', 'phone')}
            {field('Email', 'email', { type: 'email' })}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field('Website', 'website')}
            {field('Instagram', 'instagram', { placeholder: '@handle' })}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {field('Rating', 'rating', { placeholder: '4.5' })}
            {field('City', 'city', { placeholder: 'Dublin' })}
            {field('Country', 'country', { placeholder: 'Ireland' })}
          </div>
          <div>
            <Label className="text-zinc-300 text-xs mb-1 block">Notes</Label>
            <Textarea value={form.notes} onChange={set('notes')} rows={2} className="bg-zinc-900 border-zinc-800 resize-none" />
          </div>
          <Button type="submit" disabled={saving} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
            {saving ? 'Adding…' : 'Add to Lead Bank'}
          </Button>
        </form>
      </Card>
    </div>
  )
}

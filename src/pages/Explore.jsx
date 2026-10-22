import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { Flame, Star, Clock, Clapperboard, LayoutGrid, SlidersHorizontal, X, Sparkles, Upload } from 'lucide-react'
import apiClient from '@/lib/api'
import ProjectCard from '@/components/ProjectCard'
import Pagination from '@/components/Pagination'
import CardSkeletons from '@/components/CardSkeletons'
import { Button } from '@/components/ui/button'
import { selectClass } from '@/lib/helpers'

const VIEWS = {
  all: { label: 'All', icon: LayoutGrid, ordering: '-is_featured,-created_at', extra: {} },
  trending: { label: 'Trending', icon: Flame, ordering: '-views_count,-likes_count', extra: {} },
  featured: { label: 'Featured', icon: Star, ordering: '-created_at', extra: { featured: 'true' } },
  latest: { label: 'Latest', icon: Clock, ordering: '-created_at', extra: {} },
  video: { label: 'Video demos', icon: Clapperboard, ordering: '-created_at', extra: { has_video: 'true' } },
}

const SORT_OPTIONS = [
  { value: '', label: 'Default for this view' },
  { value: '-created_at', label: 'Newest' },
  { value: '-likes_count', label: 'Most liked' },
  { value: '-views_count', label: 'Most viewed' },
]

export default function Explore() {
  const [sp, setSp] = useSearchParams()
  const view = VIEWS[sp.get('view')] ? sp.get('view') : 'all'
  const q = sp.get('q') || ''
  const category = sp.get('category') || ''
  const techStack = sp.get('tech') || ''
  const batch = sp.get('batch') || ''
  const sort = sp.get('sort') || ''
  const page = Number(sp.get('page') || 1)
  const [showFilters, setShowFilters] = useState(false)

  const update = (patch, resetPage = true) => {
    const next = new URLSearchParams(sp)
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)))
    if (resetPage) next.delete('page')
    setSp(next)
  }

  const { data: options } = useQuery({
    queryKey: ['filter-options'],
    queryFn: async () => (await apiClient.get('/filter-options/')).data,
    staleTime: 5 * 60 * 1000,
  })

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['projects', view, q, category, techStack, batch, sort, page],
    queryFn: async () => {
      const params = { ordering: sort || VIEWS[view].ordering, page, ...VIEWS[view].extra }
      if (q) params.search = q
      if (category) params.category = category
      if (techStack) params.tech_stack = techStack
      if (batch) params.batch = batch
      return (await apiClient.get('/projects/', { params })).data
    },
    placeholderData: keepPreviousData,
  })

  useEffect(() => {
    document.title = 'Student Showcase'
  }, [])

  const hasFilters = q || category || techStack || batch || sort
  const clearAll = () => {
    const next = new URLSearchParams()
    if (view !== 'all') next.set('view', view)
    setSp(next)
  }
  const projects = data?.results || []

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-8">
      {/* Hero */}
      {view === 'all' && !hasFilters && (
        <section className="relative overflow-hidden rounded-3xl bg-brand-gradient animated-gradient p-8 sm:p-12 text-white shadow-2xl shadow-primary/30">
          <div className="absolute -right-16 -top-16 size-64 rounded-full bg-white/15 blur-2xl" />
          <div className="absolute -bottom-20 left-1/3 size-72 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="relative max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
              <Sparkles className="size-3.5" /> Built by students, reviewed by instructors
            </span>
            <h1 className="mt-4 text-3xl font-black leading-tight sm:text-5xl">
              Show the world what you have built.
            </h1>
            <p className="mt-3 text-white/90 sm:text-lg">
              Explore live demos, videos and source code from our students, and share your own projects.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/upload">
                <Button size="lg" className="h-10 bg-white px-4 text-gray-900 hover:bg-white/90">
                  <Upload /> Upload your project
                </Button>
              </Link>
              <Link to="/leaderboard">
                <Button size="lg" variant="outline" className="h-10 border-white/50 bg-white/10 px-4 text-white hover:bg-white/20 hover:text-white">
                  Top creators
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* View chips */}
      <div className="flex flex-wrap items-center gap-2">
        {Object.entries(VIEWS).map(([key, v]) => {
          const Icon = v.icon
          const active = key === view
          return (
            <button
              key={key}
              onClick={() => update({ view: key === 'all' ? '' : key })}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all ${
                active
                  ? 'bg-brand-gradient border-transparent text-white shadow-md shadow-primary/30'
                  : 'bg-card hover:border-primary/50 hover:text-primary'
              }`}
            >
              <Icon className="size-4" /> {v.label}
            </button>
          )
        })}
        <Button variant="outline" size="sm" className="ml-auto" onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters}>
          <SlidersHorizontal /> Filters
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="animate-fade-up grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs font-medium text-muted-foreground">Category
            <select className={`${selectClass} mt-1`} value={category} onChange={(e) => update({ category: e.target.value })}>
              <option value="">All categories</option>
              {options?.categories?.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
            </select>
          </label>
          <label className="text-xs font-medium text-muted-foreground">Tech stack
            <select className={`${selectClass} mt-1`} value={techStack} onChange={(e) => update({ tech: e.target.value })}>
              <option value="">All technologies</option>
              {options?.tech_stack?.map((t) => <option key={t.id} value={t.slug}>{t.name}</option>)}
            </select>
          </label>
          <label className="text-xs font-medium text-muted-foreground">Batch
            <select className={`${selectClass} mt-1`} value={batch} onChange={(e) => update({ batch: e.target.value })}>
              <option value="">All batches</option>
              {options?.batches?.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </label>
          <label className="text-xs font-medium text-muted-foreground">Sort by
            <select className={`${selectClass} mt-1`} value={sort} onChange={(e) => update({ sort: e.target.value })} aria-label="Sort projects">
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
        </div>
      )}

      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {q && <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">Search: “{q}”</span>}
          <Button variant="ghost" size="sm" onClick={clearAll}><X /> Clear all</Button>
        </div>
      )}

      {isLoading && <CardSkeletons />}
      {isError && <p className="text-destructive">Failed to load projects. Please try again.</p>}

      {!isLoading && !isError && projects.length === 0 && (
        <div className="rounded-2xl border border-dashed p-14 text-center text-muted-foreground">
          <Sparkles className="mx-auto mb-3 size-8 text-primary" />
          No projects found{hasFilters || view !== 'all' ? ' for this selection.' : ' yet. Be the first to upload one!'}
        </div>
      )}

      <div className={`grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 transition-opacity ${isFetching && !isLoading ? 'opacity-60' : ''}`}>
        {projects.map((project, i) => <ProjectCard key={project.id} project={project} index={i} />)}
      </div>

      <Pagination page={page} count={data?.count} onPageChange={(p) => update({ page: p > 1 ? String(p) : '' }, false)} />
    </div>
  )
}

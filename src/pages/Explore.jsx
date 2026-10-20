import { useState, useEffect } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import ProjectCard from '@/components/ProjectCard'
import Pagination from '@/components/Pagination'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { selectClass } from '@/lib/helpers'

const SORT_OPTIONS = [
  { value: '-is_featured,-created_at', label: 'Featured first' },
  { value: '-created_at', label: 'Newest' },
  { value: '-likes_count', label: 'Most liked' },
  { value: '-views_count', label: 'Most viewed' },
]

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

export default function Explore() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [techStack, setTechStack] = useState('')
  const [batch, setBatch] = useState('')
  const [ordering, setOrdering] = useState(SORT_OPTIONS[0].value)
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  const debouncedSearch = useDebounce(search, 400)

  const { data: options } = useQuery({
    queryKey: ['filter-options'],
    queryFn: async () => (await apiClient.get('/filter-options/')).data,
    staleTime: 5 * 60 * 1000,
  })

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['projects', debouncedSearch, category, techStack, batch, ordering, page],
    queryFn: async () => {
      const params = { ordering, page }
      if (debouncedSearch) params.search = debouncedSearch
      if (category) params.category = category
      if (techStack) params.tech_stack = techStack
      if (batch) params.batch = batch
      const res = await apiClient.get('/projects/', { params })
      return res.data
    },
    placeholderData: keepPreviousData,
  })

  // Filter badalte hi page 1 par wapas
  const change = (setter) => (e) => {
    setter(e.target.value)
    setPage(1)
  }

  const hasFilters = search || category || techStack || batch
  const clearFilters = () => {
    setSearch('')
    setCategory('')
    setTechStack('')
    setBatch('')
    setPage(1)
  }

  const projects = data?.results || []

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 p-4 sm:p-8">
      {/* Filters Sidebar (mobile par toggle) */}
      <aside className="w-full lg:w-56 shrink-0 lg:sticky lg:top-8 lg:self-start">
        <div className="flex items-center justify-between lg:block">
          <h2 className="font-semibold dark:text-white">Filters</h2>
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden"
            onClick={() => setShowFilters((s) => !s)}
            aria-expanded={showFilters}
          >
            {showFilters ? 'Hide' : 'Show'}
          </Button>
        </div>

        <div className={`${showFilters ? 'block' : 'hidden'} lg:block space-y-4 mt-4`}>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
            <select className={selectClass} value={category} onChange={change(setCategory)}>
              <option value="">All categories</option>
              {options?.categories?.map((c) => (
                <option key={c.id} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Tech stack</label>
            <select className={selectClass} value={techStack} onChange={change(setTechStack)}>
              <option value="">All technologies</option>
              {options?.tech_stack?.map((t) => (
                <option key={t.id} value={t.slug}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Batch</label>
            <select className={selectClass} value={batch} onChange={change(setBatch)}>
              <option value="">All batches</option>
              {options?.batches?.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear all
            </Button>
          )}
        </div>
      </aside>

      {/* Projects Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Input
            placeholder="Search by title, tech or student..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full sm:max-w-md dark:bg-gray-900 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-400"
          />
          <select
            className={`${selectClass} sm:w-48`}
            value={ordering}
            onChange={change(setOrdering)}
            aria-label="Sort projects"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {isLoading && <p className="dark:text-gray-300">Loading projects...</p>}
        {isError && <p className="text-red-500">Failed to load projects.</p>}

        {!isLoading && !isError && projects.length === 0 && (
          <div className="border border-dashed rounded-lg p-10 text-center text-gray-500">
            No projects found{hasFilters ? ' for these filters.' : ' yet.'}
          </div>
        )}

        <div
          className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 transition-opacity ${
            isFetching ? 'opacity-60' : ''
          }`}
        >
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>

        <Pagination page={page} count={data?.count} onPageChange={setPage} />
      </div>
    </div>
  )
}

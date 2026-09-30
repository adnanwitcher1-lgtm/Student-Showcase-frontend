
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import ProjectCard from '@/components/ProjectCard'
import { Input } from '@/components/ui/input'

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

  const debouncedSearch = useDebounce(search, 400)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['projects', debouncedSearch, category, techStack],

    queryFn: async () => {
      const params = {}

      if (debouncedSearch) params.search = debouncedSearch
      if (category) params.category = category
      if (techStack) params.tech_stack = techStack

      const res = await apiClient.get('/projects/', { params })

      return res.data
    },
  })

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 sm:p-8">

      {/* Filters Sidebar */}
      <aside className="w-full lg:w-56 shrink-0 lg:sticky lg:top-8 lg:self-start space-y-4">

        <h2 className="font-semibold dark:text-white">
          Filters
        </h2>

        <Input
          placeholder="Category slug"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="dark:bg-gray-900 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-400"
        />

        <Input
          placeholder="Tech stack slug"
          value={techStack}
          onChange={(e) => setTechStack(e.target.value)}
          className="dark:bg-gray-900 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-400"
        />

      </aside>

      {/* Projects Content */}
      <div className="flex-1 min-w-0">

        <Input
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-6 w-full max-w-md dark:bg-gray-900 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-400"
        />

        {isLoading && (
          <p className="dark:text-gray-300">
            Loading projects...
          </p>
        )}

        {isError && (
          <p className="text-red-500">
            Failed to load projects.
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {data?.results?.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
            />
          ))}
        </div>

      </div>
    </div>
  )
}


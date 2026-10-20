import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import apiClient from '@/lib/api'
import { getErrorMessage } from '@/lib/helpers'
import StatusBadge from '@/components/StatusBadge'
import Pagination from '@/components/Pagination'
import ProjectCard from '@/components/ProjectCard'
import { Button } from '@/components/ui/button'

export default function MyProjects() {
  const [tab, setTab] = useState('mine')
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-projects', tab, page],
    queryFn: async () => {
      const params = { page, ordering: '-created_at' }
      params[tab === 'mine' ? 'mine' : 'bookmarked'] = 'true'
      return (await apiClient.get('/projects/', { params })).data
    },
    placeholderData: keepPreviousData,
  })

  const submit = useMutation({
    mutationFn: async (slug) => (await apiClient.post(`/projects/${slug}/submit/`)).data,
    onSuccess: () => {
      toast.success('Project submitted for review!')
      queryClient.invalidateQueries({ queryKey: ['my-projects'] })
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Could not submit the project.')),
  })

  const switchTab = (t) => {
    setTab(t)
    setPage(1)
  }

  const projects = data?.results || []
  const tabClass = (t) =>
    `px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
      tab === t
        ? 'border-gray-900 dark:border-white'
        : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
    }`

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">My Space</h1>
        <Link to="/upload"><Button size="sm">+ New project</Button></Link>
      </div>

      <div className="flex border-b mb-6">
        <button className={tabClass('mine')} onClick={() => switchTab('mine')}>My projects</button>
        <button className={tabClass('bookmarks')} onClick={() => switchTab('bookmarks')}>Bookmarks</button>
      </div>

      {isLoading && <p>Loading...</p>}
      {isError && <p className="text-red-500">Could not load your projects.</p>}

      {!isLoading && !isError && projects.length === 0 && (
        <div className="border border-dashed rounded-lg p-10 text-center text-gray-500">
          {tab === 'mine' ? (
            <>You have not uploaded any project yet. <Link to="/upload" className="underline">Upload your first one</Link>.</>
          ) : (
            'No bookmarks yet. Use the Save button on a project page.'
          )}
        </div>
      )}

      {tab === 'mine' && (
        <div className="space-y-4">
          {projects.map((p) => (
            <div key={p.id} className="border rounded-lg p-4 flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-32 h-24 shrink-0 rounded-md bg-gray-100 dark:bg-gray-800 overflow-hidden">
                {p.cover_image && <img src={p.cover_image} alt={p.title} className="w-full h-full object-cover" />}
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Link to={`/projects/${p.slug}`} className="font-semibold hover:underline truncate">
                    {p.title}
                  </Link>
                  <StatusBadge status={p.status} />
                </div>

                {p.status === 'rejected' && p.rejection_reason && (
                  <p className="text-sm text-red-600 dark:text-red-400">Reason: {p.rejection_reason}</p>
                )}

                <p className="text-xs text-gray-500">👁 {p.views_count} · ❤️ {p.likes_count}</p>

                <div className="flex flex-wrap gap-2">
                  <Link to={`/projects/${p.slug}`}><Button size="sm" variant="outline">View</Button></Link>
                  <Link to={`/edit/${p.slug}`}><Button size="sm" variant="outline">Edit</Button></Link>
                  {['draft', 'rejected'].includes(p.status) && (
                    <Button size="sm" onClick={() => submit.mutate(p.slug)} disabled={submit.isPending}>
                      {p.status === 'rejected' ? 'Resubmit' : 'Submit for review'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'bookmarks' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}

      <Pagination page={page} count={data?.count} onPageChange={setPage} />
    </div>
  )
}

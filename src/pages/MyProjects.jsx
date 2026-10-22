import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Eye, Heart, Bookmark, CheckCircle2, Hourglass, FilePenLine, XCircle, Pencil, ExternalLink, Send, Lock } from 'lucide-react'
import apiClient from '@/lib/api'
import { getErrorMessage } from '@/lib/helpers'
import StatusBadge from '@/components/StatusBadge'
import Pagination from '@/components/Pagination'
import ProjectCard from '@/components/ProjectCard'
import CardSkeletons from '@/components/CardSkeletons'
import { Button } from '@/components/ui/button'

function Stat({ icon: Icon, label, value, tone }) {
  return (
    <div className="lift rounded-2xl border bg-card p-4">
      <span className={`grid size-9 place-items-center rounded-xl ${tone}`}><Icon className="size-[18px]" /></span>
      <p className="mt-3 text-2xl font-bold">{value ?? '–'}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

export default function MyProjects() {
  const [sp, setSp] = useSearchParams()
  const tab = sp.get('tab') === 'bookmarks' ? 'bookmarks' : 'mine'
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

  const { data: stats } = useQuery({
    queryKey: ['my-stats'],
    queryFn: async () => (await apiClient.get('/users/me/stats/')).data,
  })

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
      queryClient.invalidateQueries({ queryKey: ['my-stats'] })
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Could not submit the project.')),
  })

  const switchTab = (t) => {
    setSp(t === 'mine' ? {} : { tab: t })
    setPage(1)
  }

  const projects = data?.results || []
  const tabClass = (t) =>
    `px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
      tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
    }`
  const bs = stats?.by_status || {}

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My projects</h1>
          <p className="text-sm text-muted-foreground">Only you can see a project until an instructor approves it.</p>
        </div>
        <Link to="/upload"><Button className="bg-brand-gradient animated-gradient border-0 text-white"><Plus /> New project</Button></Link>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
        <Stat icon={CheckCircle2} label="Approved" value={bs.approved} tone="bg-emerald-500/15 text-emerald-500" />
        <Stat icon={Hourglass} label="In review" value={bs.submitted} tone="bg-amber-500/15 text-amber-500" />
        <Stat icon={FilePenLine} label="Drafts" value={bs.draft} tone="bg-slate-500/15 text-slate-400" />
        <Stat icon={XCircle} label="Rejected" value={bs.rejected} tone="bg-red-500/15 text-red-500" />
        <Stat icon={Eye} label="Total views" value={stats?.total_views} tone="bg-sky-500/15 text-sky-500" />
        <Stat icon={Heart} label="Total likes" value={stats?.total_likes} tone="bg-pink-500/15 text-pink-500" />
      </div>

      <div className="flex border-b">
        <button className={tabClass('mine')} onClick={() => switchTab('mine')}>My projects</button>
        <button className={tabClass('bookmarks')} onClick={() => switchTab('bookmarks')}>
          <Bookmark className="mr-1 inline size-4" />Saved
        </button>
      </div>

      {isLoading && <CardSkeletons count={3} />}
      {isError && <p className="text-destructive">Could not load your projects.</p>}

      {!isLoading && !isError && projects.length === 0 && (
        <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
          {tab === 'mine' ? (
            <>You have not uploaded any project yet. <Link to="/upload" className="text-primary underline">Upload your first one</Link>.</>
          ) : (
            'Nothing saved yet. Use the Save button on a project page.'
          )}
        </div>
      )}

      {tab === 'mine' && (
        <div className="space-y-4">
          {projects.map((p, i) => (
            <div
              key={p.id}
              className="lift animate-fade-up flex flex-col gap-4 rounded-2xl border bg-card p-4 sm:flex-row"
              style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
            >
              <div className="h-28 w-full shrink-0 overflow-hidden rounded-xl bg-brand-gradient sm:w-44">
                {p.cover_image && <img src={p.cover_image} alt={p.title} className="h-full w-full object-cover" />}
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Link to={`/projects/${p.slug}`} className="truncate font-semibold hover:text-primary">{p.title}</Link>
                  <StatusBadge status={p.status} />
                </div>

                {p.status !== 'approved' && (
                  <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Lock className="size-3" /> Visible only to you{p.status === 'submitted' ? ' until it is approved' : ''}.
                  </p>
                )}

                {p.status === 'rejected' && p.rejection_reason && (
                  <p className="text-sm text-red-500">Reason: {p.rejection_reason}</p>
                )}

                <p className="flex gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Eye className="size-3.5" /> {p.views_count}</span>
                  <span className="inline-flex items-center gap-1"><Heart className="size-3.5" /> {p.likes_count}</span>
                </p>

                <div className="flex flex-wrap gap-2">
                  <Link to={`/projects/${p.slug}`}><Button size="sm" variant="outline"><ExternalLink /> View</Button></Link>
                  <Link to={`/edit/${p.slug}`}><Button size="sm" variant="outline"><Pencil /> Edit</Button></Link>
                  {['draft', 'rejected'].includes(p.status) && (
                    <Button size="sm" onClick={() => submit.mutate(p.slug)} disabled={submit.isPending}>
                      <Send /> {p.status === 'rejected' ? 'Resubmit' : 'Submit for review'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'bookmarks' && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => <ProjectCard key={p.id} project={p} index={i} />)}
        </div>
      )}

      <Pagination page={page} count={data?.count} onPageChange={setPage} />
    </div>
  )
}

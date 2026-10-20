import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import { toast } from 'sonner'
import apiClient from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import StatusBadge from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import '@/styles/markdown.css'

export default function ProjectDetail() {
  const { slug } = useParams()

  const { data: project, isLoading, isError } = useQuery({
    queryKey: ['project', slug],
    queryFn: async () => {
      const res = await apiClient.get(`/projects/${slug}/`)
      return res.data
    },
  })

  if (isLoading) return <p className="p-8">Loading project...</p>
  if (isError || !project) return <p className="p-8 text-red-500">Project not found.</p>

  // Guest ko backend sirf limited fields deta hai (description wagera nahi)
  const isGuest = project.description === undefined

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8">
      <Hero project={project} isGuest={isGuest} />

      {isGuest ? (
        <div className="mt-8 border rounded-lg p-6 text-center space-y-3">
          <p className="font-medium">Login to see the full project: description, demo, GitHub and source code.</p>
          <div className="flex justify-center gap-3">
            <Link to="/login"><Button>Login</Button></Link>
            <Link to="/register"><Button variant="outline">Register</Button></Link>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="overview" className="mt-8">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="demo">Live Demo</TabsTrigger>
            <TabsTrigger value="github">GitHub</TabsTrigger>
            <TabsTrigger value="source">Source Code</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
          </TabsList>

          <TabsContent value="overview"><OverviewTab project={project} /></TabsContent>
          <TabsContent value="demo"><DemoTab slug={slug} project={project} /></TabsContent>
          <TabsContent value="github"><GitHubTab slug={slug} /></TabsContent>
          <TabsContent value="source"><SourceTab slug={slug} /></TabsContent>
          <TabsContent value="comments"><CommentsTab slug={slug} /></TabsContent>
        </Tabs>
      )}
    </div>
  )
}

function useToggleMutation(project, endpoint, field, messages) {
  const queryClient = useQueryClient()
  const key = ['project', project.slug]

  return useMutation({
    mutationFn: async () => (await apiClient.post(`/projects/${project.slug}/${endpoint}/`)).data,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData(key)
      queryClient.setQueryData(key, (old) => ({
        ...old,
        [field]: !old[field],
        ...(field === 'liked'
          ? { likes_count: old.liked ? old.likes_count - 1 : old.likes_count + 1 }
          : {}),
      }))
      return { previous }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(key, context.previous)
      toast.error(messages.error)
    },
    onSuccess: (data) => toast.success(data[field] ? messages.on : messages.off),
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}

function Hero({ project, isGuest }) {
  const { user } = useAuth()

  const likeMutation = useToggleMutation(project, 'like', 'liked', {
    on: 'Project liked!', off: 'Like removed.', error: 'Could not update like. Please try again.',
  })
  const bookmarkMutation = useToggleMutation(project, 'bookmark', 'bookmarked', {
    on: 'Saved to your bookmarks.', off: 'Bookmark removed.', error: 'Could not update bookmark.',
  })

  const requireLogin = (mutation) => () => {
    if (!user) return toast.info('Please login first.')
    mutation.mutate()
  }

  const isOwner = user && project.owner === user.username
  const tags = project.tech_stack || []
  const categoryName = typeof project.category === 'string' ? project.category : project.category?.name

  return (
    <div>
      {project.cover_image && (
        <img src={project.cover_image} alt={project.title} className="w-full h-48 sm:h-64 object-cover rounded-lg" />
      )}

      {/* Owner ko apne project ka status aur (reject par) wajah dikhao */}
      {isOwner && project.status && project.status !== 'approved' && (
        <div className="mt-4 border rounded-lg p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <StatusBadge status={project.status} />
            {project.status === 'rejected' && project.rejection_reason && (
              <p className="text-sm text-red-600 dark:text-red-400">
                Reason: {project.rejection_reason}
              </p>
            )}
            {project.status === 'draft' && (
              <p className="text-sm text-gray-500">Only you can see this until you submit it.</p>
            )}
          </div>
          {['draft', 'rejected'].includes(project.status) && (
            <Link to={`/edit/${project.slug}`}><Button size="sm">Edit & resubmit</Button></Link>
          )}
        </div>
      )}

      <div className="flex flex-wrap justify-between items-start gap-3 mt-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{project.title}</h1>
          {!isGuest && (
            <p className="text-gray-500">
              by {project.owner}
              {project.owner_batch ? ` · ${project.owner_batch}` : ''}
              {categoryName ? ` · ${categoryName}` : ''}
              {project.is_featured ? ' · ★ Featured' : ''}
            </p>
          )}
          {isGuest && categoryName && <p className="text-gray-500">{categoryName}</p>}
        </div>

        {!isGuest && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={requireLogin(likeMutation)}>
              {project.liked ? '❤️' : '🤍'} {project.likes_count}
            </Button>
            <Button variant="outline" onClick={requireLogin(bookmarkMutation)} aria-pressed={project.bookmarked}>
              {project.bookmarked ? '🔖 Saved' : '🔖 Save'}
            </Button>
          </div>
        )}
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {tags.map((t) => (
            <span key={t.id} className="rounded-md bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-xs text-gray-700 dark:text-gray-300">
              {t.name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function Gallery({ screenshots }) {
  const [active, setActive] = useState(null)

  useEffect(() => {
    if (!active) return
    const onKey = (e) => e.key === 'Escape' && setActive(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active])

  if (!screenshots?.length) return null

  return (
    <div className="mt-6">
      <h3 className="font-semibold mb-3">Screenshots</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {screenshots.map((s) => (
          <button key={s.id} type="button" onClick={() => setActive(s.image)} className="rounded-lg overflow-hidden border hover:opacity-90">
            <img src={s.image} alt="Project screenshot" className="w-full h-32 object-cover" />
          </button>
        ))}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setActive(null)}
          role="dialog"
          aria-modal="true"
        >
          <img src={active} alt="Screenshot preview" className="max-h-[90vh] max-w-[90vw] rounded-lg" />
        </div>
      )}
    </div>
  )
}

function OverviewTab({ project }) {
  return (
    <div className="py-4">
      <div className="md-content">
        <ReactMarkdown>{project.description || 'No description provided.'}</ReactMarkdown>
      </div>
      <Gallery screenshots={project.screenshots} />
    </div>
  )
}

function DemoTab({ slug, project }) {
  const { data, isLoading } = useQuery({
    queryKey: ['demo-url', slug],
    queryFn: async () => (await apiClient.get(`/projects/${slug}/demo-url/`)).data,
    retry: false,
  })

  const { data: site, isLoading: siteLoading } = useQuery({
    queryKey: ['static-site', slug],
    queryFn: async () => (await apiClient.get(`/projects/${slug}/static-site-url/`)).data,
    retry: false,
  })

  const liveUrl = project?.live_demo_url
  const hasUploadedDemo = Boolean(data?.demo_url)
  const siteUrl = site?.site_url

  if (isLoading || siteLoading) return <p className="py-4">Loading demo...</p>

  if (!liveUrl && !hasUploadedDemo && !siteUrl) {
    return <p className="py-4 text-gray-500">No live demo available for this project.</p>
  }

  return (
    <div className="py-4 space-y-6">
      {liveUrl && (
        <div>
          <a href={liveUrl} target="_blank" rel="noopener noreferrer">
            <Button>Open live demo ↗</Button>
          </a>
          <p className="text-xs text-gray-400 mt-2 break-all">{liveUrl}</p>
        </div>
      )}

      {siteUrl && (
        <div>
          <iframe
            src={siteUrl}
            title="Hosted demo"
            className="w-full h-[28rem] border rounded-lg bg-white"
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
          <a href={siteUrl} target="_blank" rel="noopener noreferrer" className="text-xs underline text-gray-500">
            Open hosted demo in a new tab ↗
          </a>
        </div>
      )}

      {hasUploadedDemo && (
        <div>
          <iframe
            src={data.demo_url}
            title="Live Demo"
            className="w-full h-96 border rounded-lg"
            sandbox="allow-scripts allow-same-origin"
          />
          <p className="text-xs text-gray-400 mt-2">This link expires in {data.expires_in_seconds} seconds.</p>
        </div>
      )}
    </div>
  )
}

function GitHubTab({ slug }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['github-meta', slug],
    queryFn: async () => (await apiClient.get(`/projects/${slug}/github-meta/`)).data,
    retry: false,
  })

  if (isLoading) return <p className="py-4">Loading GitHub data...</p>
  if (isError) {
    return (
      <p className="py-4 text-gray-500">
        No GitHub data yet. It is fetched automatically a few hours after the project is approved.
      </p>
    )
  }

  return (
    <div className="py-4">
      <div className="flex flex-wrap gap-6 mb-4 text-sm">
        <span>⭐ {data.stars} stars</span>
        <span>🍴 {data.forks} forks</span>
        {data.primary_language && <span>💻 {data.primary_language}</span>}
      </div>
      <div
        className="md-content border-t pt-4"
        dangerouslySetInnerHTML={{ __html: data.readme_html }}
      />
    </div>
  )
}

// View-only: copy/select/right-click band hai (deterrent, poori security nahi).
function SourceTab({ slug }) {
  const { data, isLoading } = useQuery({
    queryKey: ['source-preview', slug],
    queryFn: async () => (await apiClient.get(`/projects/${slug}/source-preview/`)).data,
  })

  if (isLoading) return <p className="py-4">Loading source preview...</p>
  const snippets = Array.isArray(data) ? data : data?.results || []

  if (snippets.length === 0) {
    return <p className="py-4 text-gray-500">No source code preview has been added for this project.</p>
  }

  return (
    <div className="py-4 space-y-5">
      <p className="text-xs text-gray-500">View-only preview. Copying is disabled.</p>
      {snippets.map((s) => (
        <div key={s.id} className="border rounded-lg overflow-hidden">
          <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm font-mono flex justify-between">
            <span>{s.filename}</span>
            {s.language && <span className="text-gray-500">{s.language}</span>}
          </div>
          <pre
            className="p-3 text-xs sm:text-sm overflow-x-auto select-none"
            onCopy={(e) => e.preventDefault()}
            onCut={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
          >
            <code>{s.content}</code>
          </pre>
        </div>
      ))}
    </div>
  )
}

function CommentsTab({ slug }) {
  const [text, setText] = useState('')
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const isStaff = user && ['instructor', 'admin'].includes(user.role)

  const { data, isLoading } = useQuery({
    queryKey: ['comments', slug],
    queryFn: async () => (await apiClient.get(`/projects/${slug}/comment/`)).data,
  })

  const comments = data?.results || []

  const addComment = useMutation({
    mutationFn: async () => (await apiClient.post(`/projects/${slug}/comment/`, { text })).data,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['comments', slug] })
      const previous = queryClient.getQueryData(['comments', slug])
      const optimisticComment = {
        id: `temp-${Date.now()}`,
        author: user?.username || 'You',
        text,
        created_at: new Date().toISOString(),
      }
      queryClient.setQueryData(['comments', slug], (old) => ({
        ...old,
        results: [optimisticComment, ...(old?.results || [])],
      }))
      return { previous }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['comments', slug], context.previous)
      toast.error('Could not post comment. Please try again.')
    },
    onSuccess: () => {
      setText('')
      toast.success('Comment posted!')
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['comments', slug] }),
  })

  const deleteComment = useMutation({
    mutationFn: async (id) => apiClient.delete(`/projects/${slug}/comments/${id}/`),
    onSuccess: () => {
      toast.success('Comment deleted.')
      queryClient.invalidateQueries({ queryKey: ['comments', slug] })
    },
    onError: () => toast.error('Could not delete comment.'),
  })

  return (
    <div className="py-4 space-y-4">
      {user ? (
        <div className="flex gap-2">
          <Input placeholder="Add a comment..." value={text} onChange={(e) => setText(e.target.value)} />
          <Button onClick={() => text.trim() && addComment.mutate()} disabled={addComment.isPending}>
            Post
          </Button>
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          <Link to="/login" className="underline">Login</Link> to post a comment.
        </p>
      )}

      {isLoading && <p>Loading comments...</p>}
      {!isLoading && comments.length === 0 && <p className="text-gray-500">No comments yet.</p>}

      <div className="space-y-3">
        {comments.map((c) => {
          const canDelete = user && !String(c.id).startsWith('temp-') && (isStaff || c.author === user.username)
          return (
            <div key={c.id} className="border rounded-lg p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-sm">
                  {c.author}
                  {c.created_at && (
                    <span className="ml-2 text-xs font-normal text-gray-400">
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  )}
                </p>
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => deleteComment.mutate(c.id)}
                    disabled={deleteComment.isPending}
                  >
                    Delete
                  </Button>
                )}
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 break-words">{c.text}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

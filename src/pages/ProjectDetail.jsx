import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import { toast } from 'sonner'
import apiClient from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import StatusBadge from '@/components/StatusBadge'
import Avatar from '@/components/Avatar'
import GithubIcon from '@/components/GithubIcon'
import { Heart, Bookmark, Lock, Download, Trash2, Plus } from 'lucide-react'
import { getErrorMessage, textareaClass } from '@/lib/helpers'
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

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-4 sm:p-8">
        <div className="skeleton h-64 w-full" />
        <div className="skeleton h-10 w-2/3" />
        <div className="skeleton h-24 w-full" />
      </div>
    )
  }
  if (isError || !project) return <p className="p-8 text-destructive">Project not found, or it is not available yet.</p>

  // Guest ko backend sirf limited fields deta hai (description wagera nahi)
  const isGuest = project.description === undefined

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-8">
      <Hero project={project} isGuest={isGuest} />

      {isGuest ? (
        <div className="mt-8 space-y-3 rounded-2xl border bg-card p-8 text-center">
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
            <TabsTrigger value="demo">Live Demo / Video</TabsTrigger>
            <TabsTrigger value="github">GitHub</TabsTrigger>
            <TabsTrigger value="source">Source Code</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
          </TabsList>

          <TabsContent value="overview"><OverviewTab project={project} /></TabsContent>
          <TabsContent value="demo"><DemoTab slug={slug} project={project} /></TabsContent>
          <TabsContent value="github"><GitHubTab slug={slug} /></TabsContent>
          <TabsContent value="source"><SourceTab slug={slug} project={project} /></TabsContent>
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
        <div className="relative overflow-hidden rounded-3xl">
          <img src={project.cover_image} alt={project.title} className="h-52 w-full object-cover sm:h-72" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      )}

      {/* Owner sees status (and rejection reason) of their own project */}
      {isOwner && project.status && project.status !== 'approved' && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3">
          <div className="space-y-1">
            <StatusBadge status={project.status} />
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Lock className="size-3.5" />
              {project.status === 'submitted' && 'Only you can see this until an instructor approves it.'}
              {project.status === 'draft' && 'Only you can see this until you submit it.'}
              {project.status === 'rejected' && 'Only you can see this. Fix the issues and resubmit.'}
            </p>
            {project.status === 'rejected' && project.rejection_reason && (
              <p className="text-sm text-red-500">Reason: {project.rejection_reason}</p>
            )}
          </div>
          {['draft', 'rejected'].includes(project.status) && (
            <Link to={`/edit/${project.slug}`}><Button size="sm">Edit &amp; resubmit</Button></Link>
          )}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-black sm:text-4xl">{project.title}</h1>
          {!isGuest && (
            <div className="mt-3 flex items-center gap-3">
              <Avatar src={project.owner_avatar} name={project.owner} size="md" />
              <div className="text-sm">
                <p className="font-semibold">{project.owner}</p>
                <p className="text-muted-foreground">
                  {[project.owner_batch, categoryName, project.is_featured ? '★ Featured' : ''].filter(Boolean).join(' · ')}
                </p>
              </div>
              {project.owner_github && (
                <a
                  href={`https://github.com/${project.owner_github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary"
                  aria-label="Owner on GitHub"
                >
                  <GithubIcon className="size-5" />
                </a>
              )}
            </div>
          )}
          {isGuest && categoryName && <p className="text-muted-foreground">{categoryName}</p>}
        </div>

        {!isGuest && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={requireLogin(likeMutation)} aria-pressed={project.liked}>
              <Heart className={project.liked ? 'fill-pink-500 text-pink-500 animate-pop' : ''} /> {project.likes_count}
            </Button>
            <Button variant="outline" onClick={requireLogin(bookmarkMutation)} aria-pressed={project.bookmarked}>
              <Bookmark className={project.bookmarked ? 'fill-primary text-primary animate-pop' : ''} />
              {project.bookmarked ? 'Saved' : 'Save'}
            </Button>
          </div>
        )}
      </div>

      {tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((t) => (
            <span key={t.id} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
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

  const videoUrl = project?.demo_video

  if (!liveUrl && !hasUploadedDemo && !siteUrl && !videoUrl) {
    return <p className="py-4 text-muted-foreground">No live demo or video available for this project.</p>
  }

  return (
    <div className="py-4 space-y-6">
      {videoUrl && (
        <div>
          <h3 className="mb-2 font-semibold">Demo video</h3>
          <video
            src={videoUrl}
            controls
            preload="metadata"
            playsInline
            className="w-full rounded-2xl border bg-black"
          >
            Your browser cannot play this video.
          </video>
        </div>
      )}

      {liveUrl && (
        <div>
          <a href={liveUrl} target="_blank" rel="noopener noreferrer">
            <Button>Open live demo ↗</Button>
          </a>
          <p className="text-xs text-muted-foreground mt-2 break-all">{liveUrl}</p>
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
          <a href={siteUrl} target="_blank" rel="noopener noreferrer" className="text-xs underline text-muted-foreground">
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
          <p className="text-xs text-muted-foreground mt-2">This link expires in {data.expires_in_seconds} seconds.</p>
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
      <p className="py-4 text-muted-foreground">
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

// View-only: copy/select/right-click is blocked (a deterrent, not full security).
function SourceTab({ slug, project }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const isOwner = user && project?.owner === user.username
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ filename: '', language: '', content: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['source-preview', slug],
    queryFn: async () => (await apiClient.get(`/projects/${slug}/source-preview/`)).data,
  })
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['source-preview', slug] })

  const importGithub = useMutation({
    mutationFn: async () => (await apiClient.post(`/projects/${slug}/source-import/`)).data,
    onSuccess: (rows) => { toast.success(`Imported ${rows.length} file(s) from GitHub.`); refresh() },
    onError: (err) => toast.error(getErrorMessage(err, 'Could not import from GitHub.')),
  })
  const addSnippet = useMutation({
    mutationFn: async () => (await apiClient.post(`/projects/${slug}/source-preview/`, form)).data,
    onSuccess: () => { toast.success('File added.'); setForm({ filename: '', language: '', content: '' }); setAdding(false); refresh() },
    onError: (err) => toast.error(getErrorMessage(err, 'Could not add the file.')),
  })
  const removeSnippet = useMutation({
    mutationFn: async (id) => apiClient.delete(`/projects/${slug}/source-preview/${id}/`),
    onSuccess: () => { toast.success('File removed.'); refresh() },
    onError: () => toast.error('Could not remove the file.'),
  })

  if (isLoading) return <div className="skeleton my-4 h-40" />
  const snippets = Array.isArray(data) ? data : data?.results || []

  const ownerTools = isOwner && (
    <div className="space-y-3 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-4">
      <p className="text-sm text-muted-foreground">
        Only you see these tools. Import your code from GitHub in one click, or paste files by hand.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => importGithub.mutate()} disabled={importGithub.isPending || !project.github_url}>
          <Download /> {importGithub.isPending ? 'Importing...' : 'Import from GitHub'}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setAdding((a) => !a)}><Plus /> Add a file</Button>
      </div>
      {!project.github_url && <p className="text-xs text-amber-500">Add a GitHub link to your project to enable the import.</p>}
      {adding && (
        <div className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <Input placeholder="File name, e.g. views.py" value={form.filename} onChange={(e) => setForm({ ...form, filename: e.target.value })} />
            <Input placeholder="Language (optional)" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} />
          </div>
          <textarea
            className={`${textareaClass} font-mono text-xs`}
            placeholder="Paste the code here (max 20000 characters)"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />
          <Button size="sm" onClick={() => addSnippet.mutate()} disabled={addSnippet.isPending}>Save file</Button>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-5 py-4">
      {ownerTools}

      {snippets.length === 0 ? (
        <p className="py-4 text-muted-foreground">No source code preview has been added for this project yet.</p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">View-only preview. Copying is disabled.</p>
          {snippets.map((s) => (
            <div key={s.id} className="overflow-hidden rounded-2xl border bg-card">
              <div className="flex items-center justify-between gap-2 border-b bg-muted px-3 py-2 font-mono text-sm">
                <span className="truncate">{s.filename}</span>
                <span className="flex items-center gap-2">
                  {s.language && <span className="text-muted-foreground">{s.language}</span>}
                  {isOwner && (
                    <button onClick={() => removeSnippet.mutate(s.id)} className="text-muted-foreground hover:text-destructive" aria-label="Remove file">
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </span>
              </div>
              <pre
                className="select-none overflow-x-auto p-3 text-xs sm:text-sm"
                onCopy={(e) => e.preventDefault()}
                onCut={(e) => e.preventDefault()}
                onContextMenu={(e) => e.preventDefault()}
              >
                <code>{s.content}</code>
              </pre>
            </div>
          ))}
        </>
      )}
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
        <p className="text-sm text-muted-foreground">
          <Link to="/login" className="underline">Login</Link> to post a comment.
        </p>
      )}

      {isLoading && <p>Loading comments...</p>}
      {!isLoading && comments.length === 0 && <p className="text-muted-foreground">No comments yet.</p>}

      <div className="space-y-3">
        {comments.map((c) => {
          const canDelete = user && !String(c.id).startsWith('temp-') && (isStaff || c.author === user.username)
          return (
            <div key={c.id} className="rounded-2xl border bg-card p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-sm">
                  {c.author}
                  {c.created_at && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
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
              <p className="text-sm text-foreground/80 mt-1 break-words">{c.text}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

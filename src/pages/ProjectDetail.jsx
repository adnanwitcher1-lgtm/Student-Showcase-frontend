import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import { toast } from 'sonner'
import apiClient from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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

  return (
    <div className="max-w-4xl mx-auto p-8">
      <Hero project={project} />
      <Tabs defaultValue="overview" className="mt-8">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="demo">Live Demo</TabsTrigger>
          <TabsTrigger value="github">GitHub</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab project={project} />
        </TabsContent>
        <TabsContent value="demo">
          <DemoTab slug={slug} project={project} />
        </TabsContent>
        <TabsContent value="github">
          <GitHubTab slug={slug} />
        </TabsContent>
        <TabsContent value="comments">
          <CommentsTab slug={slug} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Hero({ project }) {
  const queryClient = useQueryClient()

  const likeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/projects/${project.slug}/like/`)
      return res.data
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['project', project.slug] })
      const previous = queryClient.getQueryData(['project', project.slug])

      queryClient.setQueryData(['project', project.slug], (old) => ({
        ...old,
        likes_count: old.liked ? old.likes_count - 1 : old.likes_count + 1,
        liked: !old.liked,
      }))

      return { previous }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['project', project.slug], context.previous)
      toast.error('Could not update like. Please try again.')
    },
    onSuccess: (data) => {
      toast.success(data.liked ? 'Project liked!' : 'Like removed.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['project', project.slug] })
    },
  })

  return (
    <div>
      {project.cover_image && (
        <img
          src={project.cover_image}
          alt={project.title}
          className="w-full h-64 object-cover rounded-lg"
        />
      )}
      <div className="flex justify-between items-start mt-4">
        <div>
          <h1 className="text-3xl font-bold">{project.title}</h1>
          <p className="text-gray-500">by {project.owner}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => likeMutation.mutate()}>
            ❤️ {project.likes_count}
          </Button>
        </div>
      </div>
    </div>
  )
}

function OverviewTab({ project }) {
  return (
    <div className="prose max-w-none py-4">
      <ReactMarkdown>{project.description || 'No description provided.'}</ReactMarkdown>
    </div>
  )
}

function DemoTab({ slug, project }) {
  const { data, isLoading } = useQuery({
    queryKey: ['demo-url', slug],
    queryFn: async () => {
      const res = await apiClient.get(`/projects/${slug}/demo-url/`)
      return res.data
    },
    retry: false,
  })

  const liveUrl = project?.live_demo_url
  const hasUploadedDemo = Boolean(data?.demo_url)

  if (isLoading) return <p className="py-4">Loading demo...</p>

  if (!liveUrl && !hasUploadedDemo) {
    return <p className="py-4 text-gray-500">No live demo available for this project.</p>
  }

  return (
    <div className="py-4 space-y-4">
      {liveUrl && (
        <div>
          <a href={liveUrl} target="_blank" rel="noopener noreferrer">
            <Button>Open live demo ↗</Button>
          </a>
          <p className="text-xs text-gray-400 mt-2 break-all">{liveUrl}</p>
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
          <p className="text-xs text-gray-400 mt-2">
            This link expires in {data.expires_in_seconds} seconds.
          </p>
        </div>
      )}
    </div>
  )
}

function GitHubTab({ slug }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['github-meta', slug],
    queryFn: async () => {
      const res = await apiClient.get(`/projects/${slug}/github-meta/`)
      return res.data
    },
    retry: false,
  })

  if (isLoading) return <p className="py-4">Loading GitHub data...</p>
  if (isError) return <p className="py-4 text-gray-500">No GitHub data available.</p>

  return (
    <div className="py-4">
      <div className="flex gap-6 mb-4 text-sm">
        <span>⭐ {data.stars} stars</span>
        <span>🍴 {data.forks} forks</span>
        <span>💻 {data.primary_language}</span>
      </div>
      <div
        className="prose max-w-none border-t pt-4"
        dangerouslySetInnerHTML={{ __html: data.readme_html }}
      />
    </div>
  )
}

function CommentsTab({ slug }) {
  const [text, setText] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['comments', slug],
    queryFn: async () => {
      const res = await apiClient.get(`/projects/${slug}/comment/`)
      return res.data
    },
  })

  const comments = data?.results || []

  const addComment = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/projects/${slug}/comment/`, { text })
      return res.data
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['comments', slug] })
      const previous = queryClient.getQueryData(['comments', slug])

      const optimisticComment = {
        id: `temp-${Date.now()}`,
        author: 'You',
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
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', slug] })
    },
  })

  return (
    <div className="py-4 space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Add a comment..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <Button
          onClick={() => text.trim() && addComment.mutate()}
          disabled={addComment.isPending}
        >
          Post
        </Button>
      </div>

      {isLoading && <p>Loading comments...</p>}
      {comments.length === 0 && <p className="text-gray-500">No comments yet.</p>}

      <div className="space-y-3">
        {comments.map((c) => (
          <div key={c.id} className="border rounded-lg p-3">
            <p className="font-medium text-sm">{c.author}</p>
            <p className="text-sm text-gray-700">{c.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
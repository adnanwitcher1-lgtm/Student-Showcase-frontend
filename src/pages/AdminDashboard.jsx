import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import apiClient from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export default function AdminDashboard() {
  const [rejectingSlug, setRejectingSlug] = useState(null)
  const [reason, setReason] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-projects'],
    queryFn: async () => {
      const res = await apiClient.get('/projects/', {
        params: { status: 'submitted' },
      })
      return res.data
    },
  })

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/stats/')
      return res.data
    },
  })

  const approveMutation = useMutation({
    mutationFn: async (slug) => {
      const res = await apiClient.post(`/projects/${slug}/approve/`)
      return res.data
    },
    onSuccess: () => {
      toast.success('Project approved.')
      queryClient.invalidateQueries({ queryKey: ['admin-projects'] })
    },
    onError: () => toast.error('Could not approve project.'),
  })

  const rejectMutation = useMutation({
    mutationFn: async ({ slug, reason }) => {
      const res = await apiClient.post(`/projects/${slug}/reject/`, { reason })
      return res.data
    },
    onSuccess: () => {
      toast.success('Project rejected.')
      setRejectingSlug(null)
      setReason('')
      queryClient.invalidateQueries({ queryKey: ['admin-projects'] })
    },
    onError: () => toast.error('Could not reject project.'),
  })

  const featureMutation = useMutation({
    mutationFn: async (slug) => {
      const res = await apiClient.post(`/projects/${slug}/feature/`)
      return res.data
    },
    onSuccess: (data) => {
      toast.success(data.is_featured ? 'Project featured.' : 'Feature removed.')
      queryClient.invalidateQueries({ queryKey: ['admin-projects'] })
    },
    onError: () => toast.error('Could not update feature status.'),
  })

  if (isLoading) {
    return <p className="p-8 dark:text-white">Loading pending projects...</p>
  }

  const projects = data?.results || []

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">
        Pending Projects
      </h1>

      {/* Dashboard Stats */}
      {!statsLoading && stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Total Projects */}
          <div className="border dark:border-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Projects
            </p>
            <p className="text-2xl font-bold dark:text-white">
              {stats.total_projects}
            </p>
          </div>

          {/* Total Students */}
          <div className="border dark:border-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Students
            </p>
            <p className="text-2xl font-bold dark:text-white">
              {stats.total_students}
            </p>
          </div>

          {/* Top Liked Projects */}
          <div className="border dark:border-gray-800 rounded-lg p-4 md:col-span-1">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Top Liked Projects
            </p>

            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={stats.top_liked_projects}>
                <XAxis dataKey="title" tick={false} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar
                  dataKey="likes_count"
                  fill="#6FA8FF"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Weekly Views Trend */}
          <div className="border dark:border-gray-800 rounded-lg p-4 md:col-span-3">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Weekly Views Trend
            </p>

            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={stats.weekly_views_trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="#6FA8FF"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Pending Projects */}
      {projects.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400">
          No projects waiting for review.
        </p>
      )}

      <div className="space-y-4">
        {projects.map((project) => (
          <div
            key={project.id}
            className="border dark:border-gray-800 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div>
              <p className="font-semibold dark:text-white">
                {project.title}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                by {project.owner} · {project.category || 'Uncategorized'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => approveMutation.mutate(project.slug)}
              >
                Approve
              </Button>

              <Button
                size="sm"
                variant="destructive"
                onClick={() => setRejectingSlug(project.slug)}
              >
                Reject
              </Button>

              <Button
                size="sm"
                variant={project.is_featured ? 'default' : 'outline'}
                onClick={() => featureMutation.mutate(project.slug)}
              >
                {project.is_featured ? '★ Featured' : '☆ Feature'}
              </Button>
            </div>

            {rejectingSlug === project.slug && (
              <div className="w-full flex gap-2 mt-2">
                <Input
                  placeholder="Reason for rejection"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />

                <Button
                  size="sm"
                  onClick={() =>
                    reason.trim() &&
                    rejectMutation.mutate({
                      slug: project.slug,
                      reason,
                    })
                  }
                  disabled={rejectMutation.isPending}
                >
                  Confirm
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRejectingSlug(null)}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
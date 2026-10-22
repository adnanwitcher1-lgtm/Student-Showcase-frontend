import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Trophy, Eye, Heart, FolderKanban } from 'lucide-react'
import apiClient from '@/lib/api'
import Avatar from '@/components/Avatar'

const MEDAL = ['from-amber-300 to-yellow-500', 'from-slate-200 to-slate-400', 'from-orange-300 to-orange-600']

export default function Leaderboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => (await apiClient.get('/leaderboard/')).data,
    staleTime: 60 * 1000,
  })

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <span className="grid size-12 place-items-center rounded-2xl bg-brand-gradient shadow-lg shadow-primary/30">
          <Trophy className="size-6 text-white" />
        </span>
        <div>
          <h1 className="text-2xl font-bold">Top creators</h1>
          <p className="text-sm text-muted-foreground">Ranked by likes and views on approved projects.</p>
        </div>
      </div>

      {isLoading && <div className="space-y-3">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-16" />)}</div>}
      {isError && <p className="text-destructive">Could not load the leaderboard.</p>}
      {!isLoading && !isError && data?.length === 0 && (
        <p className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">No creators yet.</p>
      )}

      <ol className="space-y-3">
        {data?.map((r, i) => (
          <li
            key={r.username}
            className="animate-fade-up lift flex items-center gap-4 rounded-2xl border bg-card p-4"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <span
              className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-black ${
                r.rank <= 3 ? `bg-gradient-to-br ${MEDAL[r.rank - 1]} text-gray-900` : 'bg-muted text-muted-foreground'
              }`}
            >
              {r.rank}
            </span>
            <Link to={`/?q=${encodeURIComponent(r.username)}`} className="flex min-w-0 flex-1 items-center gap-3 hover:text-primary">
              <Avatar src={r.avatar} name={r.username} size="md" />
              <div className="min-w-0">
                <p className="truncate font-semibold">{r.username}</p>
                {r.batch && <p className="truncate text-xs text-muted-foreground">{r.batch}</p>}
              </div>
            </Link>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1" title="Projects"><FolderKanban className="size-4" />{r.projects}</span>
              <span className="inline-flex items-center gap-1" title="Likes"><Heart className="size-4 text-pink-500" />{r.likes}</span>
              <span className="hidden sm:inline-flex items-center gap-1" title="Views"><Eye className="size-4" />{r.views}</span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

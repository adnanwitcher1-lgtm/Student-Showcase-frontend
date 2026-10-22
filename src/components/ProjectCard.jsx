import { Link } from 'react-router-dom'
import { Eye, Heart, Star, PlayCircle } from 'lucide-react'
import Avatar from '@/components/Avatar'
import StatusBadge from '@/components/StatusBadge'

export default function ProjectCard({ project, index = 0, showStatus = false }) {
  const tags = project.tech_stack || []

  return (
    <Link
      to={`/projects/${project.slug}`}
      className="group block h-full animate-fade-up"
      style={{ animationDelay: `${Math.min(index, 11) * 45}ms` }}
    >
      <article className="lift flex h-full flex-col overflow-hidden rounded-2xl border bg-card">
        <div className="relative h-44 w-full shrink-0 overflow-hidden bg-brand-gradient animated-gradient">
          {project.cover_image ? (
            <img
              src={project.cover_image}
              alt={project.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="grid h-full place-items-center text-5xl font-black text-white/70">
              {project.title?.[0]?.toUpperCase()}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

          <div className="absolute top-2 left-2 flex gap-1.5">
            {project.is_featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 text-amber-950 text-[11px] font-bold px-2.5 py-0.5 shadow">
                <Star className="size-3 fill-current" /> Featured
              </span>
            )}
            {project.has_video && (
              <span className="inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur text-white text-[11px] font-semibold px-2.5 py-0.5">
                <PlayCircle className="size-3" /> Video
              </span>
            )}
          </div>
          {showStatus && (
            <div className="absolute top-2 right-2"><StatusBadge status={project.status} /></div>
          )}

          {project.category && (
            <span className="absolute bottom-2 left-2 rounded-full bg-white/90 text-gray-900 text-[11px] font-semibold px-2.5 py-0.5">
              {project.category}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-4">
          <h3 className="truncate text-lg font-semibold transition-colors group-hover:text-primary">
            {project.title}
          </h3>

          {project.owner && (
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Avatar src={project.owner_avatar} name={project.owner} size="xs" />
              <span className="truncate">{project.owner}</span>
            </div>
          )}

          {tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.slice(0, 3).map((t) => (
                <span key={t} className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {t}
                </span>
              ))}
              {tags.length > 3 && <span className="py-0.5 text-xs text-muted-foreground">+{tags.length - 3}</span>}
            </div>
          )}

          <div className="mt-auto flex items-center justify-between pt-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Eye className="size-4" /> {project.views_count}</span>
            <span className="inline-flex items-center gap-1.5">
              <Heart className="size-4 text-pink-500" /> {project.likes_count}
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}

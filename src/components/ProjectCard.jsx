import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'

export default function ProjectCard({ project }) {
  const tags = project.tech_stack || []

  return (
    <Link to={`/projects/${project.slug}`} className="h-full block">
      <Card className="hover:shadow-lg transition-shadow overflow-hidden h-full flex flex-col dark:bg-gray-900 dark:border-gray-800">
        <div className="relative w-full h-40 bg-gray-100 dark:bg-gray-800 shrink-0">
          {project.cover_image && (
            <img
              src={project.cover_image}
              alt={project.title}
              className="w-full h-full object-cover"
            />
          )}
          {project.is_featured && (
            <span className="absolute top-2 left-2 rounded-full bg-yellow-400 text-yellow-950 text-xs font-semibold px-2.5 py-0.5 shadow">
              ★ Featured
            </span>
          )}
        </div>

        <CardContent className="p-4 flex-1 flex flex-col">
          <h3 className="font-semibold text-lg truncate dark:text-white">
            {project.title}
          </h3>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            {project.category || 'Uncategorized'}
            {project.owner ? ` · by ${project.owner}` : ''}
          </p>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="rounded-md bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs text-gray-700 dark:text-gray-300"
                >
                  {t}
                </span>
              ))}
              {tags.length > 3 && (
                <span className="text-xs text-gray-500 py-0.5">+{tags.length - 3}</span>
              )}
            </div>
          )}

          <div className="flex justify-between items-center mt-auto pt-3 text-sm text-gray-600 dark:text-gray-400">
            <span>👁 {project.views_count}</span>
            <span>❤️ {project.likes_count}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

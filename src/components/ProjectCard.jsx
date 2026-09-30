import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'

export default function ProjectCard({ project }) {
  return (
    <Link to={`/projects/${project.slug}`} className="h-full block">
      <Card className="hover:shadow-lg transition-shadow overflow-hidden h-full flex flex-col dark:bg-gray-900 dark:border-gray-800">
        <div className="w-full h-40 bg-gray-100 dark:bg-gray-800 shrink-0">
          {project.cover_image && (
            <img
              src={project.cover_image}
              alt={project.title}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        <CardContent className="p-4 flex-1 flex flex-col">
          <h3 className="font-semibold text-lg truncate dark:text-white">
            {project.title}
          </h3>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            {project.category || 'Uncategorized'}
          </p>

          <div className="flex justify-between items-center mt-auto pt-3 text-sm text-gray-600 dark:text-gray-400">
            <span>👁 {project.views_count}</span>
            <span>❤️ {project.likes_count}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
import { Button } from '@/components/ui/button'

export default function Pagination({ page, count, pageSize = 10, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil((count || 0) / pageSize))
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-3 mt-8">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Previous
      </Button>
      <span className="text-sm text-gray-600 dark:text-gray-400">
        Page {page} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </Button>
    </div>
  )
}

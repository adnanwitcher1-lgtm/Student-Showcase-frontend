import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Pagination({ page, count, pageSize = 10, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil((count || 0) / pageSize))
  if (totalPages <= 1) return null

  return (
    <div className="mt-10 flex items-center justify-center gap-3">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        <ChevronLeft /> Previous
      </Button>
      <span className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        Next <ChevronRight />
      </Button>
    </div>
  )
}

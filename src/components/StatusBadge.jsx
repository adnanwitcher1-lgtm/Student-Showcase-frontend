const STYLES = {
  draft: 'bg-slate-500/15 text-slate-600 dark:text-slate-300 ring-slate-500/30',
  submitted: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-amber-500/30',
  approved: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-emerald-500/30',
  rejected: 'bg-red-500/15 text-red-700 dark:text-red-300 ring-red-500/30',
}

const LABELS = {
  draft: 'Draft',
  submitted: 'Waiting for review',
  approved: 'Approved',
  rejected: 'Rejected',
}

export default function StatusBadge({ status }) {
  if (!status) return null
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 backdrop-blur ${
        STYLES[status] || STYLES.draft
      }`}
    >
      {LABELS[status] || status}
    </span>
  )
}

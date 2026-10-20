const STYLES = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  submitted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
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
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
        STYLES[status] || STYLES.draft
      }`}
    >
      {LABELS[status] || status}
    </span>
  )
}

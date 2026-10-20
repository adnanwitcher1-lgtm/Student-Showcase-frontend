// Shared UI helpers (classes + backend error message parser)

export const selectClass =
  'h-9 w-full rounded-lg border border-input bg-white dark:bg-gray-900 px-2.5 text-sm ' +
  'outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

export const textareaClass =
  'w-full min-h-32 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm ' +
  'outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

export const fileInputClass =
  'block w-full text-sm text-gray-600 dark:text-gray-300 ' +
  'file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 ' +
  'file:text-sm file:font-medium file:bg-gray-900 file:text-white ' +
  'hover:file:bg-gray-700 file:cursor-pointer ' +
  'border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-3'

// Backend ke error response se readable message nikalta hai
export function getErrorMessage(err, fallback) {
  const data = err?.response?.data
  if (!data) return fallback
  if (typeof data === 'string') return fallback
  if (data.detail) return data.detail
  if (data.errors?.length) {
    const first = data.errors[0]
    const key = Object.keys(first)[0]
    return `${key}: ${JSON.stringify(first[key])}`
  }
  const firstKey = Object.keys(data)[0]
  if (firstKey) {
    const val = data[firstKey]
    return `${firstKey}: ${Array.isArray(val) ? val.join(' ') : String(val)}`
  }
  return fallback
}

import { useState } from 'react'

const SIZES = {
  xs: 'size-6 text-[10px]',
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-16 text-xl',
  xl: 'size-24 text-3xl',
}

// Picture if there is one, otherwise a colourful default avatar with the first letter.
export default function Avatar({ src, name = '?', size = 'md', className = '' }) {
  const [broken, setBroken] = useState(false)
  const letter = (name || '?').trim()[0]?.toUpperCase() || '?'
  const cls = `${SIZES[size] || SIZES.md} rounded-full shrink-0 ${className}`

  if (src && !broken) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setBroken(true)}
        className={`${cls} object-cover ring-2 ring-primary/40`}
      />
    )
  }
  return (
    <div
      aria-label={name}
      className={`${cls} bg-brand-gradient animated-gradient flex items-center justify-center font-semibold text-white ring-2 ring-primary/30`}
    >
      {letter}
    </div>
  )
}

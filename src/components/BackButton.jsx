import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Goes to the previous page. If there is no history (page opened directly) it goes Home.
export default function BackButton({ className = '' }) {
  const navigate = useNavigate()
  const { pathname, search } = useLocation()

  if (pathname === '/' && !search) return null

  const goBack = () => {
    const idx = window.history.state?.idx
    if (typeof idx === 'number' && idx > 0) navigate(-1)
    else navigate('/')
  }

  return (
    <Button variant="outline" size="sm" onClick={goBack} className={className} aria-label="Go back">
      <ArrowLeft />
      <span className="hidden sm:inline">Back</span>
    </Button>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import SocialButtons from '@/components/SocialButtons'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await login(username, password)
      toast.success('Logged in successfully!')
      navigate('/')
    } catch {
      toast.error('Invalid username or password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('error') === 'social') {
      toast.error('Social login failed. Please try again.')
    }
  }, [])

  return (
    <div className="max-w-md mx-auto mt-12 p-8 border rounded-xl shadow-lg bg-card">
      <h1 className="text-3xl font-bold mb-6 text-center dark:text-white">
        Login
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Logging in...' : 'Login'}
        </Button>
      </form>

      <SocialButtons />
    </div>
  )
}

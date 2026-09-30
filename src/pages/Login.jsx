import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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

  const handleGithubLogin = () => {
    window.location.href =
      'http://localhost:8000/accounts/github/login/'
  }

  return (
    <div className="max-w-md mx-auto mt-12 p-8 border rounded-xl shadow-lg bg-white dark:bg-gray-900">
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

      <div className="my-6 flex items-center">
        <div className="flex-grow border-t"></div>
        <span className="mx-4 text-gray-500">OR</span>
        <div className="flex-grow border-t"></div>
      </div>

      <button
        onClick={handleGithubLogin}
        className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
      >
        <svg
          height="20"
          width="20"
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 005.47 7.59c.4.07.55-.17.55-.38
          0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13
          -.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87
          2.33.66.07-.52.28-.87.5-1.07-1.78-.2-3.64-.89-3.64-3.95
          0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12
          0 0 .67-.21 2.2.82a7.65 7.65 0 012-.27c.68 0 1.36.09 2 .27
          1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82
          1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54
          1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01
          8.01 0 0016 8c0-4.42-3.58-8-8-8z"/>
        </svg>

        <span className="font-medium">
          Continue with GitHub
        </span>
      </button>
    </div>
  )
}
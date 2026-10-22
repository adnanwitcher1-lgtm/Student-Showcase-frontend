import { useEffect } from 'react'

// Google/GitHub login ke baad backend yahan bhejta hai: /auth/callback#access=<token>
export default function AuthCallback() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const access = params.get('access')

    if (access) {
      localStorage.setItem('access_token', access)
      // Poora reload, taake AuthProvider naye token se user load kare
      window.location.replace('/')
    } else {
      window.location.replace('/login?error=social')
    }
  }, [])

  return <p className="text-center mt-20 text-muted-foreground">Signing you in...</p>
}

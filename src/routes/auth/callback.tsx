import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { createClient } from '../../lib/supabase/client'

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallback,
})

function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const supabase = createClient()

    // Handle the OAuth callback
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Successfully signed in, redirect to home
        navigate({ to: '/' })
      }
    })

    // Also check if we already have a session (email confirmation)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate({ to: '/' })
      }
    })
  }, [navigate])

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
        <p className="text-amber-900 font-medium">Signing you in...</p>
      </div>
    </div>
  )
}

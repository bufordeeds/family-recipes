import { createServerClient, parseCookieHeader } from '@supabase/ssr'
import type { Database } from './types'

export function createServerSupabaseClient(request: Request) {
  const cookies = parseCookieHeader(request.headers.get('cookie') ?? '')

  return createServerClient<Database>(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookies
            .filter((c): c is { name: string; value: string } => c.value !== undefined)
            .map(({ name, value }) => ({ name, value }))
        },
        setAll() {
          // In TanStack Start, cookies are set via response headers
          // This is handled at the route level
        },
      },
    }
  )
}

import { Link } from '@tanstack/react-router'
import { useAuth } from '../hooks/useAuth'
import { signOut } from '../lib/supabase/auth'
import { Home, TreeDeciduous, PlusCircle, Search, User, LogOut } from 'lucide-react'

export default function Header() {
  const { user, loading } = useAuth()

  async function handleSignOut() {
    await signOut()
    window.location.href = '/login'
  }

  // Don't show header on login page
  if (typeof window !== 'undefined' && window.location.pathname === '/login') {
    return null
  }

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden md:flex items-center justify-between px-6 py-4 bg-white border-b border-amber-100">
        <Link to="/" className="text-xl font-bold text-amber-900">
          Family Recipes
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            to="/"
            className="text-amber-700 hover:text-amber-900 transition-colors"
            activeProps={{ className: 'text-amber-900 font-medium' }}
          >
            Home
          </Link>
          {user && (
            <>
              <Link
                to="/tree"
                className="text-amber-700 hover:text-amber-900 transition-colors"
                activeProps={{ className: 'text-amber-900 font-medium' }}
              >
                Family Tree
              </Link>
              <Link
                to="/recipes/new"
                className="text-amber-700 hover:text-amber-900 transition-colors"
                activeProps={{ className: 'text-amber-900 font-medium' }}
              >
                Add Recipe
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-amber-100 animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-amber-700">{user.email}</span>
              <button
                onClick={handleSignOut}
                className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors"
                title="Sign out"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      </header>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-amber-100 px-2 pb-safe z-50">
        <div className="flex items-center justify-around py-2">
          <Link
            to="/"
            className="flex flex-col items-center gap-1 px-3 py-2 text-amber-600"
            activeProps={{ className: 'flex flex-col items-center gap-1 px-3 py-2 text-amber-900' }}
          >
            <Home size={24} />
            <span className="text-xs">Home</span>
          </Link>

          {user ? (
            <>
              <Link
                to="/tree"
                className="flex flex-col items-center gap-1 px-3 py-2 text-amber-600"
                activeProps={{ className: 'flex flex-col items-center gap-1 px-3 py-2 text-amber-900' }}
              >
                <TreeDeciduous size={24} />
                <span className="text-xs">Tree</span>
              </Link>

              <Link
                to="/recipes/new"
                className="flex flex-col items-center gap-1 px-3 py-2"
              >
                <div className="bg-amber-600 text-white p-2 rounded-full -mt-4 shadow-lg">
                  <PlusCircle size={28} />
                </div>
              </Link>

              <Link
                to="/search"
                className="flex flex-col items-center gap-1 px-3 py-2 text-amber-600"
                activeProps={{ className: 'flex flex-col items-center gap-1 px-3 py-2 text-amber-900' }}
              >
                <Search size={24} />
                <span className="text-xs">Search</span>
              </Link>

              <Link
                to="/profile"
                className="flex flex-col items-center gap-1 px-3 py-2 text-amber-600"
                activeProps={{ className: 'flex flex-col items-center gap-1 px-3 py-2 text-amber-900' }}
              >
                <User size={24} />
                <span className="text-xs">Profile</span>
              </Link>
            </>
          ) : (
            <Link
              to="/login"
              className="flex flex-col items-center gap-1 px-3 py-2 text-amber-600"
            >
              <User size={24} />
              <span className="text-xs">Sign in</span>
            </Link>
          )}
        </div>
      </nav>
    </>
  )
}

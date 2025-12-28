import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useUserFamilies, useCreateFamily, useJoinFamily } from '../../hooks/useFamily'
import { Users, Plus, UserPlus, ArrowRight, Loader2 } from 'lucide-react'

export const Route = createFileRoute('/family/setup')({
  component: FamilySetupPage,
})

function FamilySetupPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { data: families, isLoading: familiesLoading } = useUserFamilies()
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose')

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    navigate({ to: '/login' })
    return null
  }

  // If user already has families, redirect to home
  if (!familiesLoading && families && families.length > 0) {
    navigate({ to: '/' })
    return null
  }

  if (authLoading || familiesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 px-4 py-8">
      <div className="max-w-md mx-auto">
        {mode === 'choose' && <ChooseMode onSelect={setMode} />}
        {mode === 'create' && <CreateFamily onBack={() => setMode('choose')} />}
        {mode === 'join' && <JoinFamily onBack={() => setMode('choose')} />}
      </div>
    </div>
  )
}

function ChooseMode({ onSelect }: { onSelect: (mode: 'create' | 'join') => void }) {
  return (
    <>
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-amber-900 mb-2">Set Up Your Family</h1>
        <p className="text-amber-700">
          Create a new family or join an existing one with an invite code.
        </p>
      </div>

      <div className="space-y-4">
        <button
          onClick={() => onSelect('create')}
          className="w-full bg-white rounded-2xl p-6 shadow-sm border border-amber-100 hover:border-amber-300 transition-all text-left flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Plus className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Create a Family</h3>
            <p className="text-sm text-gray-600">Start fresh and invite others to join</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400" />
        </button>

        <button
          onClick={() => onSelect('join')}
          className="w-full bg-white rounded-2xl p-6 shadow-sm border border-amber-100 hover:border-amber-300 transition-all text-left flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <UserPlus className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Join a Family</h3>
            <p className="text-sm text-gray-600">Enter an invite code from a family member</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400" />
        </button>
      </div>
    </>
  )
}

function CreateFamily({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate()
  const createFamily = useCreateFamily()
  const [familyName, setFamilyName] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!familyName.trim()) return

    const { data, error } = await createFamily.mutateAsync(familyName.trim())

    if (error) {
      alert(error.message)
      return
    }

    if (data) {
      navigate({ to: '/family/$familyId', params: { familyId: data.id } })
    }
  }

  return (
    <>
      <button
        onClick={onBack}
        className="text-amber-600 hover:text-amber-700 font-medium mb-6 flex items-center gap-1"
      >
        <ArrowRight className="w-4 h-4 rotate-180" />
        Back
      </button>

      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Plus className="w-8 h-8 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-amber-900 mb-2">Create Your Family</h1>
        <p className="text-amber-700">
          Give your family a name. You can invite others after.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="familyName" className="block text-sm font-medium text-gray-700 mb-2">
            Family Name
          </label>
          <input
            id="familyName"
            type="text"
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            placeholder="e.g., The Smith Family"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={createFamily.isPending || !familyName.trim()}
          className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {createFamily.isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Family'
          )}
        </button>
      </form>
    </>
  )
}

function JoinFamily({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const joinFamily = useJoinFamily()
  const [inviteCode, setInviteCode] = useState('')
  const [memberName, setMemberName] = useState(
    user?.user_metadata?.full_name || user?.email?.split('@')[0] || ''
  )
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteCode.trim() || !memberName.trim()) return

    setError(null)
    const { data, error } = await joinFamily.mutateAsync({
      inviteCode: inviteCode.trim(),
      memberName: memberName.trim(),
    })

    if (error) {
      setError(error.message)
      return
    }

    if (data) {
      navigate({ to: '/family/$familyId', params: { familyId: data.id } })
    }
  }

  return (
    <>
      <button
        onClick={onBack}
        className="text-amber-600 hover:text-amber-700 font-medium mb-6 flex items-center gap-1"
      >
        <ArrowRight className="w-4 h-4 rotate-180" />
        Back
      </button>

      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <UserPlus className="w-8 h-8 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-amber-900 mb-2">Join a Family</h1>
        <p className="text-amber-700">
          Enter the invite code shared by a family member.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 mb-2">
            Invite Code
          </label>
          <input
            id="inviteCode"
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder="e.g., ABC123XY"
            required
            maxLength={8}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all font-mono text-center text-lg tracking-wider uppercase"
          />
        </div>

        <div>
          <label htmlFor="memberName" className="block text-sm font-medium text-gray-700 mb-2">
            Your Name (as shown in family)
          </label>
          <input
            id="memberName"
            type="text"
            value={memberName}
            onChange={(e) => setMemberName(e.target.value)}
            placeholder="e.g., John Smith"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={joinFamily.isPending || !inviteCode.trim() || !memberName.trim()}
          className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {joinFamily.isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Joining...
            </>
          ) : (
            'Join Family'
          )}
        </button>
      </form>
    </>
  )
}

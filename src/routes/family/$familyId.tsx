import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useFamily, useFamilyMembers, useAddFamilyMember } from '../../hooks/useFamily'
import { Users, Copy, Check, Plus, UserPlus, ChefHat, Loader2, ArrowLeft } from 'lucide-react'

export const Route = createFileRoute('/family/$familyId')({
  component: FamilyDetailPage,
})

function FamilyDetailPage() {
  const { familyId } = Route.useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { data: family, isLoading: familyLoading } = useFamily(familyId)
  const { data: members, isLoading: membersLoading } = useFamilyMembers(familyId)
  const [showAddMember, setShowAddMember] = useState(false)

  if (!authLoading && !user) {
    navigate({ to: '/login' })
    return null
  }

  if (authLoading || familyLoading || membersLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    )
  }

  if (!family) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Family not found</h1>
          <p className="text-gray-600 mb-4">This family doesn't exist or you don't have access.</p>
          <Link to="/" className="text-amber-600 hover:text-amber-700 font-medium">
            Go home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 pb-24 md:pb-8">
      {/* Header */}
      <div className="px-4 py-6 border-b border-amber-100 bg-white/50">
        <Link
          to="/"
          className="text-amber-600 hover:text-amber-700 font-medium mb-4 flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Home
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center">
            <Users className="w-7 h-7 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-amber-900">{family.name}</h1>
            <p className="text-amber-700">{members?.length || 0} members</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Invite Code Card */}
        <InviteCodeCard inviteCode={family.invite_code} />

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            to="/recipes/new"
            className="bg-amber-600 text-white rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-lg hover:bg-amber-700 transition-colors"
          >
            <ChefHat className="w-6 h-6" />
            <span className="font-medium text-sm">Add Recipe</span>
          </Link>
          <button
            onClick={() => setShowAddMember(true)}
            className="bg-white text-amber-900 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-sm border border-amber-100 hover:border-amber-200 transition-colors"
          >
            <UserPlus className="w-6 h-6" />
            <span className="font-medium text-sm">Add Member</span>
          </button>
        </div>

        {/* Members List */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Family Members</h2>
          <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
            {members?.map((member) => (
              <div key={member.id} className="px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <span className="text-amber-700 font-medium">
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{member.name}</p>
                  {member.is_deceased && (
                    <p className="text-sm text-gray-500">In loving memory</p>
                  )}
                  {member.user_id === user?.id && (
                    <p className="text-sm text-amber-600">You</p>
                  )}
                </div>
                {member.birth_year && (
                  <span className="text-sm text-gray-500">b. {member.birth_year}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <AddMemberModal
          familyId={familyId}
          onClose={() => setShowAddMember(false)}
        />
      )}
    </div>
  )
}

function InviteCodeCard({ inviteCode }: { inviteCode: string }) {
  const [copied, setCopied] = useState(false)

  async function copyCode() {
    await navigator.clipboard.writeText(inviteCode.toUpperCase())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h2 className="text-sm font-medium text-gray-700 mb-2">Invite Code</h2>
      <div className="flex items-center gap-3">
        <code className="flex-1 text-2xl font-mono font-bold text-amber-900 tracking-wider">
          {inviteCode.toUpperCase()}
        </code>
        <button
          onClick={copyCode}
          className="p-3 bg-amber-100 hover:bg-amber-200 rounded-xl transition-colors"
          title="Copy invite code"
        >
          {copied ? (
            <Check className="w-5 h-5 text-green-600" />
          ) : (
            <Copy className="w-5 h-5 text-amber-700" />
          )}
        </button>
      </div>
      <p className="text-sm text-gray-500 mt-3">
        Share this code with family members so they can join.
      </p>
    </div>
  )
}

function AddMemberModal({ familyId, onClose }: { familyId: string; onClose: () => void }) {
  const addMember = useAddFamilyMember()
  const [name, setName] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [isDeceased, setIsDeceased] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    const { error } = await addMember.mutateAsync({
      family_id: familyId,
      name: name.trim(),
      birth_year: birthYear ? parseInt(birthYear) : undefined,
      is_deceased: isDeceased,
    })

    if (error) {
      alert(error.message)
      return
    }

    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
      <div className="bg-white w-full md:max-w-md md:rounded-2xl rounded-t-2xl p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Add Family Member</h2>
        <p className="text-gray-600 text-sm mb-6">
          Add relatives who may not use the app, including those who have passed.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Grandma Rose"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label htmlFor="birthYear" className="block text-sm font-medium text-gray-700 mb-1">
              Birth Year (optional)
            </label>
            <input
              id="birthYear"
              type="number"
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              placeholder="e.g., 1945"
              min="1800"
              max={new Date().getFullYear()}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
            />
          </div>

          <label className="flex items-center gap-3 py-2">
            <input
              type="checkbox"
              checked={isDeceased}
              onChange={(e) => setIsDeceased(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
            />
            <span className="text-gray-700">This person has passed away</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addMember.isPending || !name.trim()}
              className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {addMember.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Add
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

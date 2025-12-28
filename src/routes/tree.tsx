import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { useAuth } from '../hooks/useAuth'
import {
  useUserFamilies,
  useFamilyMembers,
  useFamilyRelationships,
  useAddFamilyRelationship,
  useMemberRecipeCounts,
} from '../hooks/useFamily'
import { useFamilyRecipes } from '../hooks/useRecipes'
import type { FamilyMember, FamilyMemberRelationship } from '../lib/supabase/types'
import {
  Loader2,
  ChefHat,
  Plus,
  Link as LinkIcon,
  X,
  ArrowDown,
  User,
  Heart,
} from 'lucide-react'

export const Route = createFileRoute('/tree')({
  component: FamilyTreePage,
})

// A family unit is either a single parent or a couple (two parents with shared children)
interface FamilyUnit {
  parents: FamilyMember[]
  children: FamilyUnit[]
  id: string // unique identifier for the unit
}

function FamilyTreePage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { data: families, isLoading: familiesLoading } = useUserFamilies()
  const family = families?.[0]
  const { data: members, isLoading: membersLoading } = useFamilyMembers(family?.id)
  const { data: relationships, isLoading: relationshipsLoading } = useFamilyRelationships(family?.id)
  const { data: recipeCounts } = useMemberRecipeCounts(family?.id)
  const { data: recipes } = useFamilyRecipes(family?.id)

  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null)
  const [showLinkModal, setShowLinkModal] = useState(false)

  const loading = authLoading || familiesLoading || membersLoading || relationshipsLoading

  // Build tree structure with proper couple handling
  const { familyUnits, orphans } = useMemo(() => {
    if (!members || !relationships) return { familyUnits: [], orphans: [] }

    // Build maps for quick lookup
    const childToParents = new Map<string, Set<string>>()
    const parentToChildren = new Map<string, Set<string>>()

    relationships.forEach((r) => {
      // Child -> Parents
      if (!childToParents.has(r.child_id)) {
        childToParents.set(r.child_id, new Set())
      }
      childToParents.get(r.child_id)!.add(r.parent_id)

      // Parent -> Children
      if (!parentToChildren.has(r.parent_id)) {
        parentToChildren.set(r.parent_id, new Set())
      }
      parentToChildren.get(r.parent_id)!.add(r.child_id)
    })

    // Find couples (parents who share at least one child)
    const couples = new Map<string, Set<string>>() // parent1Id -> Set of partner Ids
    childToParents.forEach((parents) => {
      if (parents.size >= 2) {
        const parentArray = Array.from(parents)
        for (let i = 0; i < parentArray.length; i++) {
          for (let j = i + 1; j < parentArray.length; j++) {
            if (!couples.has(parentArray[i])) {
              couples.set(parentArray[i], new Set())
            }
            couples.get(parentArray[i])!.add(parentArray[j])
            if (!couples.has(parentArray[j])) {
              couples.set(parentArray[j], new Set())
            }
            couples.get(parentArray[j])!.add(parentArray[i])
          }
        }
      }
    })

    // Track which members have been placed in the tree
    const placed = new Set<string>()

    // Build family unit for a set of parents
    function buildFamilyUnit(parentIds: string[]): FamilyUnit {
      const parents = parentIds
        .map((id) => members.find((m) => m.id === id))
        .filter(Boolean) as FamilyMember[]

      // Get all children of these parents
      const childIds = new Set<string>()
      parentIds.forEach((pid) => {
        parentToChildren.get(pid)?.forEach((cid) => childIds.add(cid))
      })

      // Filter to only children that have ALL these parents (for couples)
      // or at least this parent (for singles)
      const sharedChildIds = Array.from(childIds).filter((cid) => {
        const childParents = childToParents.get(cid)
        if (!childParents) return false
        // Child should have at least one of these parents
        return parentIds.some((pid) => childParents.has(pid))
      })

      // Mark parents as placed
      parentIds.forEach((id) => placed.add(id))

      // Build child units recursively
      const childUnits: FamilyUnit[] = []
      const processedChildren = new Set<string>()

      sharedChildIds.forEach((childId) => {
        if (processedChildren.has(childId)) return
        processedChildren.add(childId)
        placed.add(childId)

        const child = members.find((m) => m.id === childId)
        if (!child) return

        // Check if this child has a partner (someone they share children with)
        const childPartners = couples.get(childId)
        if (childPartners && childPartners.size > 0) {
          // Find unplaced partners
          const unplacedPartner = Array.from(childPartners).find((pid) => !placed.has(pid))
          if (unplacedPartner) {
            childUnits.push(buildFamilyUnit([childId, unplacedPartner]))
          } else {
            childUnits.push(buildFamilyUnit([childId]))
          }
        } else {
          childUnits.push(buildFamilyUnit([childId]))
        }
      })

      return {
        parents,
        children: childUnits,
        id: parentIds.sort().join('-'),
      }
    }

    // Find root members (those who have no parents in the tree)
    const hasParent = new Set(relationships.map((r) => r.child_id))
    const rootMembers = members.filter((m) => !hasParent.has(m.id))

    // Build family units starting from roots
    const familyUnits: FamilyUnit[] = []
    const processedRoots = new Set<string>()

    rootMembers.forEach((root) => {
      if (processedRoots.has(root.id) || placed.has(root.id)) return

      // Check if this root has a partner
      const partners = couples.get(root.id)
      if (partners && partners.size > 0) {
        // Find partner who is also a root (no parents)
        const rootPartner = Array.from(partners).find(
          (pid) => !hasParent.has(pid) && !processedRoots.has(pid)
        )
        if (rootPartner) {
          processedRoots.add(root.id)
          processedRoots.add(rootPartner)
          familyUnits.push(buildFamilyUnit([root.id, rootPartner]))
          return
        }
      }

      processedRoots.add(root.id)
      familyUnits.push(buildFamilyUnit([root.id]))
    })

    // Find orphans (members with no relationships)
    const connectedIds = new Set([
      ...relationships.map((r) => r.parent_id),
      ...relationships.map((r) => r.child_id),
    ])
    const orphans = members.filter((m) => !connectedIds.has(m.id))

    return { familyUnits, orphans }
  }, [members, relationships])

  if (!authLoading && !user) {
    navigate({ to: '/login' })
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    )
  }

  if (!family) {
    navigate({ to: '/family/setup' })
    return null
  }

  const memberRecipes = selectedMember
    ? recipes?.filter((r) =>
        r.attributions?.some((a: { family_member_id: string }) => a.family_member_id === selectedMember.id)
      )
    : []

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 pb-24 md:pb-8">
      {/* Header */}
      <div className="px-4 py-6 border-b border-amber-100 bg-white/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-amber-900">Family Tree</h1>
            <p className="text-amber-700">{family.name}</p>
          </div>
          <button
            onClick={() => setShowLinkModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-xl transition-colors"
          >
            <LinkIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Link Members</span>
          </button>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Tree Visualization */}
        {familyUnits.length > 0 ? (
          <div className="space-y-8">
            {familyUnits.map((unit) => (
              <FamilyUnitNode
                key={unit.id}
                unit={unit}
                onSelect={setSelectedMember}
                selectedId={selectedMember?.id}
                recipeCounts={recipeCounts || {}}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No family connections yet</p>
            <p className="text-sm mt-1">Link family members to build your tree</p>
          </div>
        )}

        {/* Unlinked Members */}
        {orphans.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wide">
              Not yet connected
            </h2>
            <div className="flex flex-wrap gap-3">
              {orphans.map((member) => (
                <button
                  key={member.id}
                  onClick={() => setSelectedMember(member)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                    selectedMember?.id === member.id
                      ? 'bg-amber-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-amber-300'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                    <span className="text-xs font-medium text-amber-700">
                      {member.name.charAt(0)}
                    </span>
                  </div>
                  <span className="text-sm font-medium">{member.name}</span>
                  {(recipeCounts?.[member.id] || 0) > 0 && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                      {recipeCounts?.[member.id]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {members?.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              No family members yet
            </h2>
            <p className="text-gray-600 mb-6">
              Add family members to start building your tree.
            </p>
            <Link
              to="/family/$familyId"
              params={{ familyId: family.id }}
              className="inline-flex items-center gap-2 px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-xl transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Members
            </Link>
          </div>
        )}
      </div>

      {/* Selected Member Panel */}
      {selectedMember && (
        <MemberPanel
          member={selectedMember}
          recipes={memberRecipes || []}
          onClose={() => setSelectedMember(null)}
        />
      )}

      {/* Link Members Modal */}
      {showLinkModal && family && members && (
        <LinkMembersModal
          familyId={family.id}
          members={members}
          relationships={relationships || []}
          onClose={() => setShowLinkModal(false)}
        />
      )}
    </div>
  )
}

function FamilyUnitNode({
  unit,
  onSelect,
  selectedId,
  recipeCounts,
  depth = 0,
}: {
  unit: FamilyUnit
  onSelect: (member: FamilyMember) => void
  selectedId?: string
  recipeCounts: Record<string, number>
  depth?: number
}) {
  const isCouple = unit.parents.length === 2

  return (
    <div className={`${depth > 0 ? 'mt-6' : ''}`}>
      {/* Connector from parent */}
      {depth > 0 && (
        <div className="flex justify-center mb-2">
          <div className="w-0.5 h-6 bg-amber-300" />
        </div>
      )}

      {/* Parents */}
      <div className="flex justify-center">
        {isCouple ? (
          <div className="flex items-center gap-2">
            <MemberNode
              member={unit.parents[0]}
              onSelect={onSelect}
              isSelected={selectedId === unit.parents[0].id}
              recipeCount={recipeCounts[unit.parents[0].id] || 0}
            />
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-pink-100">
              <Heart className="w-4 h-4 text-pink-500" />
            </div>
            <MemberNode
              member={unit.parents[1]}
              onSelect={onSelect}
              isSelected={selectedId === unit.parents[1].id}
              recipeCount={recipeCounts[unit.parents[1].id] || 0}
            />
          </div>
        ) : (
          <MemberNode
            member={unit.parents[0]}
            onSelect={onSelect}
            isSelected={selectedId === unit.parents[0].id}
            recipeCount={recipeCounts[unit.parents[0].id] || 0}
          />
        )}
      </div>

      {/* Children */}
      {unit.children.length > 0 && (
        <div className="mt-2">
          {/* Vertical line down */}
          <div className="flex justify-center">
            <div className="w-0.5 h-6 bg-amber-300" />
          </div>

          {/* Horizontal connector for multiple children */}
          {unit.children.length > 1 && (
            <div className="flex justify-center">
              <div
                className="h-0.5 bg-amber-300"
                style={{
                  width: `${Math.min(unit.children.length * 180, 600)}px`,
                }}
              />
            </div>
          )}

          {/* Children nodes */}
          <div className="flex justify-center gap-8 flex-wrap">
            {unit.children.map((childUnit) => (
              <FamilyUnitNode
                key={childUnit.id}
                unit={childUnit}
                onSelect={onSelect}
                selectedId={selectedId}
                recipeCounts={recipeCounts}
                depth={depth + 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MemberNode({
  member,
  onSelect,
  isSelected,
  recipeCount,
}: {
  member: FamilyMember
  onSelect: (member: FamilyMember) => void
  isSelected: boolean
  recipeCount: number
}) {
  return (
    <button
      onClick={() => onSelect(member)}
      className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all min-w-[100px] ${
        isSelected
          ? 'bg-amber-600 text-white shadow-lg'
          : 'bg-white text-gray-900 shadow-sm hover:shadow-md'
      }`}
    >
      <div
        className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl ${
          isSelected ? 'bg-amber-500' : 'bg-amber-100 text-amber-700'
        }`}
      >
        {member.name.charAt(0)}
      </div>
      <p className="font-semibold text-sm text-center leading-tight">{member.name}</p>
      {member.birth_year && (
        <p className={`text-xs ${isSelected ? 'opacity-75' : 'text-gray-500'}`}>
          b. {member.birth_year}
        </p>
      )}
      {recipeCount > 0 && (
        <div
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
            isSelected ? 'bg-amber-500' : 'bg-amber-100 text-amber-700'
          }`}
        >
          <ChefHat className="w-3 h-3" />
          {recipeCount}
        </div>
      )}
    </button>
  )
}

function MemberPanel({
  member,
  recipes,
  onClose,
}: {
  member: FamilyMember
  recipes: Array<{ id: string; title: string }>
  onClose: () => void
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-2xl z-40 max-h-[60vh] overflow-hidden flex flex-col md:max-w-md md:right-4 md:left-auto md:bottom-4 md:rounded-2xl">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center font-bold text-amber-700">
            {member.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{member.name}</h3>
            {member.birth_year && (
              <p className="text-sm text-gray-500">
                {member.is_deceased ? 'Lived' : 'Born'} {member.birth_year}
              </p>
            )}
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
          {member.name}'s Recipes ({recipes.length})
        </h4>
        {recipes.length > 0 ? (
          <div className="space-y-2">
            {recipes.map((recipe) => (
              <Link
                key={recipe.id}
                to="/recipes/$recipeId"
                params={{ recipeId: recipe.id }}
                className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-amber-50 rounded-xl transition-colors"
              >
                <ChefHat className="w-5 h-5 text-amber-600" />
                <span className="font-medium text-gray-900">{recipe.title}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No recipes attributed yet</p>
        )}
      </div>
    </div>
  )
}

function LinkMembersModal({
  familyId,
  members,
  relationships,
  onClose,
}: {
  familyId: string
  members: FamilyMember[]
  relationships: FamilyMemberRelationship[]
  onClose: () => void
}) {
  const addRelationship = useAddFamilyRelationship()
  const [parentId, setParentId] = useState('')
  const [childId, setChildId] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!parentId || !childId) {
      setError('Please select both a parent and child')
      return
    }

    if (parentId === childId) {
      setError('Parent and child cannot be the same person')
      return
    }

    // Check if relationship already exists
    const exists = relationships.some(
      (r) => r.parent_id === parentId && r.child_id === childId
    )
    if (exists) {
      setError('This relationship already exists')
      return
    }

    const { error } = await addRelationship.mutateAsync({
      familyId,
      parentId,
      childId,
    })

    if (error) {
      setError('Failed to create relationship')
      return
    }

    setParentId('')
    setChildId('')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
      <div className="bg-white w-full md:max-w-md md:rounded-2xl rounded-t-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Link Family Members</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Parent
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none bg-white"
            >
              <option value="">Select parent...</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-center">
            <ArrowDown className="w-5 h-5 text-gray-400" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Child
            </label>
            <select
              value={childId}
              onChange={(e) => setChildId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none bg-white"
            >
              <option value="">Select child...</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={addRelationship.isPending}
            className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {addRelationship.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <LinkIcon className="w-5 h-5" />
                Create Link
              </>
            )}
          </button>
        </form>

        {/* Existing relationships */}
        {relationships.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-3">
              Existing Connections
            </h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {relationships.map((rel) => {
                const parent = members.find((m) => m.id === rel.parent_id)
                const child = members.find((m) => m.id === rel.child_id)
                return (
                  <div
                    key={rel.id}
                    className="flex items-center gap-2 text-sm text-gray-600"
                  >
                    <span>{parent?.name}</span>
                    <ArrowDown className="w-3 h-3" />
                    <span>{child?.name}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

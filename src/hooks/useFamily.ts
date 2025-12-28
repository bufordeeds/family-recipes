import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getUserFamilies,
  getFamily,
  getFamilyMembers,
  createFamily,
  joinFamily,
  addFamilyMember,
  getFamilyRelationships,
  addFamilyRelationship,
  removeFamilyRelationship,
  getMemberRecipeCount,
} from '../lib/supabase/queries'
import type { FamilyMemberInsert } from '../lib/supabase/types'

export function useUserFamilies() {
  return useQuery({
    queryKey: ['user-families'],
    queryFn: async () => {
      const { data, error } = await getUserFamilies()
      if (error) throw error
      return data
    },
  })
}

export function useFamily(familyId: string | undefined) {
  return useQuery({
    queryKey: ['family', familyId],
    queryFn: async () => {
      if (!familyId) return null
      const { data, error } = await getFamily(familyId)
      if (error) throw error
      return data
    },
    enabled: !!familyId,
  })
}

export function useFamilyMembers(familyId: string | undefined) {
  return useQuery({
    queryKey: ['family-members', familyId],
    queryFn: async () => {
      if (!familyId) return []
      const { data, error } = await getFamilyMembers(familyId)
      if (error) throw error
      return data
    },
    enabled: !!familyId,
  })
}

export function useCreateFamily() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (name: string) => createFamily(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-families'] })
    },
  })
}

export function useJoinFamily() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ inviteCode, memberName }: { inviteCode: string; memberName: string }) =>
      joinFamily(inviteCode, memberName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-families'] })
    },
  })
}

export function useAddFamilyMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (member: FamilyMemberInsert) => addFamilyMember(member),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['family-members', variables.family_id] })
    },
  })
}

export function useFamilyRelationships(familyId: string | undefined) {
  return useQuery({
    queryKey: ['family-relationships', familyId],
    queryFn: async () => {
      if (!familyId) return []
      const { data, error } = await getFamilyRelationships(familyId)
      if (error) throw error
      return data
    },
    enabled: !!familyId,
  })
}

export function useAddFamilyRelationship() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      familyId,
      parentId,
      childId,
    }: {
      familyId: string
      parentId: string
      childId: string
    }) => addFamilyRelationship(familyId, parentId, childId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['family-relationships', variables.familyId] })
    },
  })
}

export function useRemoveFamilyRelationship() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      relationshipId,
      familyId,
    }: {
      relationshipId: string
      familyId: string
    }) => removeFamilyRelationship(relationshipId).then((r) => ({ ...r, familyId })),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['family-relationships', variables.familyId] })
    },
  })
}

export function useMemberRecipeCounts(familyId: string | undefined) {
  return useQuery({
    queryKey: ['member-recipe-counts', familyId],
    queryFn: async () => {
      if (!familyId) return {}
      const { data, error } = await getMemberRecipeCount(familyId)
      if (error) throw error
      return data || {}
    },
    enabled: !!familyId,
  })
}

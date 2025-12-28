import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUserFamilies, getFamily, getFamilyMembers, createFamily, joinFamily, addFamilyMember } from '../lib/supabase/queries'
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

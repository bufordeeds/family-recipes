import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getFamilyRecipes,
  getRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  type CreateRecipeInput,
} from '../lib/supabase/queries'
import type { RecipeUpdate } from '../lib/supabase/types'

export function useFamilyRecipes(familyId: string | undefined) {
  return useQuery({
    queryKey: ['recipes', familyId],
    queryFn: async () => {
      if (!familyId) return []
      const { data, error } = await getFamilyRecipes(familyId)
      if (error) throw error
      return data
    },
    enabled: !!familyId,
  })
}

export function useRecipe(recipeId: string | undefined) {
  return useQuery({
    queryKey: ['recipe', recipeId],
    queryFn: async () => {
      if (!recipeId) return null
      const { data, error } = await getRecipe(recipeId)
      if (error) throw error
      return data
    },
    enabled: !!recipeId,
  })
}

export function useCreateRecipe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateRecipeInput) => createRecipe(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recipes', variables.familyId] })
    },
  })
}

export function useUpdateRecipe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ recipeId, updates }: { recipeId: string; updates: RecipeUpdate }) =>
      updateRecipe(recipeId, updates),
    onSuccess: (data) => {
      if (data.data) {
        queryClient.invalidateQueries({ queryKey: ['recipe', data.data.id] })
        queryClient.invalidateQueries({ queryKey: ['recipes', data.data.family_id] })
      }
    },
  })
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ recipeId, familyId }: { recipeId: string; familyId: string }) =>
      deleteRecipe(recipeId).then((result) => ({ ...result, familyId })),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recipes', variables.familyId] })
    },
  })
}

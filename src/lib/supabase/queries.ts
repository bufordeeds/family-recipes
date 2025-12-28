import { createClient } from './client'
import type {
  Family,
  FamilyInsert,
  FamilyMember,
  FamilyMemberInsert,
  Recipe,
  RecipeInsert,
  RecipeUpdate,
  IngredientInsert,
  StepInsert,
} from './types'

// Family queries
export async function getUserFamilies() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { data: null, error: new Error('Not authenticated') }

  const { data, error } = await supabase
    .from('family_members')
    .select('family:families(*)')
    .eq('user_id', user.id)

  if (error) return { data: null, error }

  const families = data?.map(d => d.family).filter(Boolean) as Family[]
  return { data: families, error: null }
}

export async function getFamily(familyId: string) {
  const supabase = createClient()
  return supabase
    .from('families')
    .select('*')
    .eq('id', familyId)
    .single()
}

export async function getFamilyByInviteCode(inviteCode: string) {
  const supabase = createClient()
  return supabase
    .from('families')
    .select('*')
    .eq('invite_code', inviteCode.toLowerCase())
    .single()
}

export async function createFamily(name: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { data: null, error: new Error('Not authenticated') }

  // Create the family
  const { data: family, error: familyError } = await supabase
    .from('families')
    .insert({ name, created_by: user.id } as FamilyInsert)
    .select()
    .single()

  if (familyError || !family) return { data: null, error: familyError }

  // Add the creator as a family member
  const { error: memberError } = await supabase
    .from('family_members')
    .insert({
      family_id: family.id,
      user_id: user.id,
      name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Me',
      added_by: user.id,
    } as FamilyMemberInsert)

  if (memberError) return { data: null, error: memberError }

  return { data: family, error: null }
}

export async function joinFamily(inviteCode: string, memberName: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { data: null, error: new Error('Not authenticated') }

  // Find the family by invite code
  const { data: family, error: familyError } = await getFamilyByInviteCode(inviteCode)

  if (familyError || !family) {
    return { data: null, error: new Error('Family not found. Check your invite code.') }
  }

  // Check if already a member
  const { data: existingMember } = await supabase
    .from('family_members')
    .select('id')
    .eq('family_id', family.id)
    .eq('user_id', user.id)
    .single()

  if (existingMember) {
    return { data: null, error: new Error('You are already a member of this family.') }
  }

  // Add as family member
  const { error: memberError } = await supabase
    .from('family_members')
    .insert({
      family_id: family.id,
      user_id: user.id,
      name: memberName,
      added_by: user.id,
    } as FamilyMemberInsert)

  if (memberError) return { data: null, error: memberError }

  return { data: family, error: null }
}

// Family member queries
export async function getFamilyMembers(familyId: string) {
  const supabase = createClient()
  return supabase
    .from('family_members')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: true })
}

export async function addFamilyMember(member: FamilyMemberInsert) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { data: null, error: new Error('Not authenticated') }

  return supabase
    .from('family_members')
    .insert({ ...member, added_by: user.id })
    .select()
    .single()
}

export async function updateFamilyMember(id: string, updates: Partial<FamilyMember>) {
  const supabase = createClient()
  return supabase
    .from('family_members')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
}

// Recipe queries
export async function getFamilyRecipes(familyId: string) {
  const supabase = createClient()
  return supabase
    .from('recipes')
    .select(`
      *,
      attributions:recipe_attributions(
        *,
        family_member:family_members(*)
      )
    `)
    .eq('family_id', familyId)
    .order('created_at', { ascending: false })
}

export async function getRecipe(recipeId: string) {
  const supabase = createClient()
  return supabase
    .from('recipes')
    .select(`
      *,
      ingredients(*),
      steps(*),
      attributions:recipe_attributions(
        *,
        family_member:family_members(*)
      ),
      comments(
        *,
        profile:profiles(*)
      )
    `)
    .eq('id', recipeId)
    .single()
}

export interface CreateRecipeInput {
  familyId: string
  title: string
  description?: string
  originStory?: string
  originYear?: number
  originLocation?: string
  prepTime?: number
  cookTime?: number
  servings?: number
  difficulty?: 'easy' | 'medium' | 'hard'
  heroImageUrl?: string
  ingredients: string[]
  steps: string[]
  attributedTo?: string // family_member_id
}

export async function createRecipe(input: CreateRecipeInput) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { data: null, error: new Error('Not authenticated') }

  // Create the recipe
  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .insert({
      family_id: input.familyId,
      title: input.title,
      description: input.description,
      origin_story: input.originStory,
      origin_year: input.originYear,
      origin_location: input.originLocation,
      prep_time: input.prepTime,
      cook_time: input.cookTime,
      servings: input.servings,
      difficulty: input.difficulty,
      hero_image_url: input.heroImageUrl,
      created_by: user.id,
    } as RecipeInsert)
    .select()
    .single()

  if (recipeError || !recipe) return { data: null, error: recipeError }

  // Add ingredients
  if (input.ingredients.length > 0) {
    const ingredientsToInsert: IngredientInsert[] = input.ingredients.map((text, index) => ({
      recipe_id: recipe.id,
      text,
      order_index: index,
    }))

    const { error: ingredientsError } = await supabase
      .from('ingredients')
      .insert(ingredientsToInsert)

    if (ingredientsError) {
      // Rollback recipe
      await supabase.from('recipes').delete().eq('id', recipe.id)
      return { data: null, error: ingredientsError }
    }
  }

  // Add steps
  if (input.steps.length > 0) {
    const stepsToInsert: StepInsert[] = input.steps.map((instruction, index) => ({
      recipe_id: recipe.id,
      instruction,
      order_index: index,
    }))

    const { error: stepsError } = await supabase
      .from('steps')
      .insert(stepsToInsert)

    if (stepsError) {
      // Rollback
      await supabase.from('ingredients').delete().eq('recipe_id', recipe.id)
      await supabase.from('recipes').delete().eq('id', recipe.id)
      return { data: null, error: stepsError }
    }
  }

  // Add attribution if provided
  if (input.attributedTo) {
    await supabase
      .from('recipe_attributions')
      .insert({
        recipe_id: recipe.id,
        family_member_id: input.attributedTo,
        attribution_type: 'created_by',
      })
  }

  return { data: recipe, error: null }
}

export async function updateRecipe(recipeId: string, updates: RecipeUpdate) {
  const supabase = createClient()
  return supabase
    .from('recipes')
    .update(updates)
    .eq('id', recipeId)
    .select()
    .single()
}

export async function deleteRecipe(recipeId: string) {
  const supabase = createClient()
  return supabase
    .from('recipes')
    .delete()
    .eq('id', recipeId)
}

// Family relationship queries
export async function getFamilyRelationships(familyId: string) {
  const supabase = createClient()
  return supabase
    .from('family_member_relationships')
    .select('*')
    .eq('family_id', familyId)
}

export async function addFamilyRelationship(
  familyId: string,
  parentId: string,
  childId: string
) {
  const supabase = createClient()
  return supabase
    .from('family_member_relationships')
    .insert({
      family_id: familyId,
      parent_id: parentId,
      child_id: childId,
    })
    .select()
    .single()
}

export async function removeFamilyRelationship(relationshipId: string) {
  const supabase = createClient()
  return supabase
    .from('family_member_relationships')
    .delete()
    .eq('id', relationshipId)
}

export async function getMemberRecipeCount(familyId: string) {
  const supabase = createClient()

  // Get recipe counts per family member through attributions
  const { data, error } = await supabase
    .from('recipe_attributions')
    .select(`
      family_member_id,
      recipe:recipes!inner(family_id)
    `)
    .eq('recipe.family_id', familyId)

  if (error) return { data: null, error }

  // Count recipes per member
  const counts: Record<string, number> = {}
  data?.forEach((attr) => {
    const memberId = attr.family_member_id
    counts[memberId] = (counts[memberId] || 0) + 1
  })

  return { data: counts, error: null }
}

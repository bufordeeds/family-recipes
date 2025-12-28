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

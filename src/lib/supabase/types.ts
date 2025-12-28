export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      families: {
        Row: {
          id: string
          name: string
          created_by: string | null
          invite_code: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_by?: string | null
          invite_code?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_by?: string | null
          invite_code?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'families_created_by_fkey'
            columns: ['created_by']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      family_members: {
        Row: {
          id: string
          family_id: string
          user_id: string | null
          name: string
          photo_url: string | null
          birth_year: number | null
          is_deceased: boolean
          added_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          family_id: string
          user_id?: string | null
          name: string
          photo_url?: string | null
          birth_year?: number | null
          is_deceased?: boolean
          added_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          user_id?: string | null
          name?: string
          photo_url?: string | null
          birth_year?: number | null
          is_deceased?: boolean
          added_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'family_members_family_id_fkey'
            columns: ['family_id']
            referencedRelation: 'families'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'family_members_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'family_members_added_by_fkey'
            columns: ['added_by']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      family_member_relationships: {
        Row: {
          id: string
          family_id: string
          parent_id: string
          child_id: string
          created_at: string
        }
        Insert: {
          id?: string
          family_id: string
          parent_id: string
          child_id: string
          created_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          parent_id?: string
          child_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'family_member_relationships_family_id_fkey'
            columns: ['family_id']
            referencedRelation: 'families'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'family_member_relationships_parent_id_fkey'
            columns: ['parent_id']
            referencedRelation: 'family_members'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'family_member_relationships_child_id_fkey'
            columns: ['child_id']
            referencedRelation: 'family_members'
            referencedColumns: ['id']
          }
        ]
      }
      recipes: {
        Row: {
          id: string
          family_id: string
          title: string
          description: string | null
          origin_story: string | null
          origin_year: number | null
          origin_location: string | null
          prep_time: number | null
          cook_time: number | null
          servings: number | null
          difficulty: 'easy' | 'medium' | 'hard' | null
          hero_image_url: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          family_id: string
          title: string
          description?: string | null
          origin_story?: string | null
          origin_year?: number | null
          origin_location?: string | null
          prep_time?: number | null
          cook_time?: number | null
          servings?: number | null
          difficulty?: 'easy' | 'medium' | 'hard' | null
          hero_image_url?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          title?: string
          description?: string | null
          origin_story?: string | null
          origin_year?: number | null
          origin_location?: string | null
          prep_time?: number | null
          cook_time?: number | null
          servings?: number | null
          difficulty?: 'easy' | 'medium' | 'hard' | null
          hero_image_url?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'recipes_family_id_fkey'
            columns: ['family_id']
            referencedRelation: 'families'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'recipes_created_by_fkey'
            columns: ['created_by']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      recipe_attributions: {
        Row: {
          id: string
          recipe_id: string
          family_member_id: string
          attribution_type: 'created_by' | 'learned_from'
          year_learned: number | null
          created_at: string
        }
        Insert: {
          id?: string
          recipe_id: string
          family_member_id: string
          attribution_type: 'created_by' | 'learned_from'
          year_learned?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string
          family_member_id?: string
          attribution_type?: 'created_by' | 'learned_from'
          year_learned?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'recipe_attributions_recipe_id_fkey'
            columns: ['recipe_id']
            referencedRelation: 'recipes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'recipe_attributions_family_member_id_fkey'
            columns: ['family_member_id']
            referencedRelation: 'family_members'
            referencedColumns: ['id']
          }
        ]
      }
      ingredients: {
        Row: {
          id: string
          recipe_id: string
          text: string
          order_index: number
        }
        Insert: {
          id?: string
          recipe_id: string
          text: string
          order_index?: number
        }
        Update: {
          id?: string
          recipe_id?: string
          text?: string
          order_index?: number
        }
        Relationships: [
          {
            foreignKeyName: 'ingredients_recipe_id_fkey'
            columns: ['recipe_id']
            referencedRelation: 'recipes'
            referencedColumns: ['id']
          }
        ]
      }
      steps: {
        Row: {
          id: string
          recipe_id: string
          instruction: string
          order_index: number
          image_url: string | null
          video_url: string | null
        }
        Insert: {
          id?: string
          recipe_id: string
          instruction: string
          order_index?: number
          image_url?: string | null
          video_url?: string | null
        }
        Update: {
          id?: string
          recipe_id?: string
          instruction?: string
          order_index?: number
          image_url?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'steps_recipe_id_fkey'
            columns: ['recipe_id']
            referencedRelation: 'recipes'
            referencedColumns: ['id']
          }
        ]
      }
      comments: {
        Row: {
          id: string
          recipe_id: string
          user_id: string
          content: string
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          recipe_id: string
          user_id: string
          content: string
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string
          user_id?: string
          content?: string
          image_url?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'comments_recipe_id_fkey'
            columns: ['recipe_id']
            referencedRelation: 'recipes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'comments_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey'
            columns: ['id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_family_member: {
        Args: {
          family_uuid: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Convenience types for easier usage
export type Family = Database['public']['Tables']['families']['Row']
export type FamilyInsert = Database['public']['Tables']['families']['Insert']
export type FamilyUpdate = Database['public']['Tables']['families']['Update']

export type FamilyMember = Database['public']['Tables']['family_members']['Row']
export type FamilyMemberInsert = Database['public']['Tables']['family_members']['Insert']
export type FamilyMemberUpdate = Database['public']['Tables']['family_members']['Update']

export type FamilyMemberRelationship = Database['public']['Tables']['family_member_relationships']['Row']

export type Recipe = Database['public']['Tables']['recipes']['Row']
export type RecipeInsert = Database['public']['Tables']['recipes']['Insert']
export type RecipeUpdate = Database['public']['Tables']['recipes']['Update']

export type RecipeAttribution = Database['public']['Tables']['recipe_attributions']['Row']
export type RecipeAttributionInsert = Database['public']['Tables']['recipe_attributions']['Insert']

export type Ingredient = Database['public']['Tables']['ingredients']['Row']
export type IngredientInsert = Database['public']['Tables']['ingredients']['Insert']

export type Step = Database['public']['Tables']['steps']['Row']
export type StepInsert = Database['public']['Tables']['steps']['Insert']

export type Comment = Database['public']['Tables']['comments']['Row']
export type CommentInsert = Database['public']['Tables']['comments']['Insert']

export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

// Extended types with relations
export type RecipeWithDetails = Recipe & {
  ingredients: Ingredient[]
  steps: Step[]
  attributions: (RecipeAttribution & { family_member: FamilyMember })[]
  comments: (Comment & { profile: Profile })[]
}

export type FamilyMemberWithRelations = FamilyMember & {
  parents: FamilyMember[]
  children: FamilyMember[]
  recipes: Recipe[]
}

import { createFileRoute, Link } from '@tanstack/react-router'
import { useAuth } from '../hooks/useAuth'
import { useUserFamilies } from '../hooks/useFamily'
import { useFamilyRecipes } from '../hooks/useRecipes'
import { ChefHat, Users, Clock, BookOpen, ArrowRight } from 'lucide-react'
import type { Recipe } from '../lib/supabase/types'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const { user, loading: authLoading } = useAuth()
  const { data: families, isLoading: familiesLoading } = useUserFamilies()

  const loading = authLoading || (user && familiesLoading)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600" />
      </div>
    )
  }

  // Logged out landing page
  if (!user) {
    return <LandingPage />
  }

  // User has no families - prompt to create/join
  if (!families || families.length === 0) {
    return <NoFamilyState />
  }

  // User has family - show home dashboard
  const family = families[0] // For now, show first family
  return <FamilyDashboard family={family} />
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      {/* Hero */}
      <section className="px-6 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ChefHat className="w-10 h-10 text-amber-600" />
          </div>
          <h1 className="text-4xl font-bold text-amber-900 mb-4">
            Family Recipes
          </h1>
          <p className="text-lg text-amber-700 mb-8">
            Preserve your family's culinary heritage. Share recipes across generations,
            track who taught who, and keep those cherished dishes alive forever.
          </p>
          <Link
            to="/login"
            className="inline-block px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl transition-colors shadow-lg"
          >
            Get Started
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-12 max-w-4xl mx-auto">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Preserve Recipes</h3>
            <p className="text-gray-600 text-sm">
              Store recipes with photos, steps, and the stories behind them.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Family Tree</h3>
            <p className="text-gray-600 text-sm">
              See who created each recipe and how it passed through generations.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Cook Mode</h3>
            <p className="text-gray-600 text-sm">
              Step-by-step instructions with timers, perfect for the kitchen.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

function NoFamilyState() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 pb-24 md:pb-8">
      <section className="px-6 py-8">
        <h1 className="text-2xl font-bold text-amber-900">Welcome!</h1>
        <p className="text-amber-700 mt-1">Let's get you set up.</p>
      </section>

      <section className="px-6">
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2 text-center">
            Join or Create a Family
          </h2>
          <p className="text-gray-600 mb-6 text-center">
            Family Recipes works best when you're connected to your family.
            Create a new family or join an existing one.
          </p>
          <Link
            to="/family/setup"
            className="flex items-center justify-center gap-2 w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl transition-colors"
          >
            Set Up Family
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}

function FamilyDashboard({ family }: { family: { id: string; name: string } }) {
  const { data: recipes, isLoading } = useFamilyRecipes(family.id)

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 pb-24 md:pb-8">
      {/* Welcome Header */}
      <section className="px-6 py-8">
        <p className="text-amber-600 text-sm font-medium">{family.name}</p>
        <h1 className="text-2xl font-bold text-amber-900">
          Welcome back!
        </h1>
        <p className="text-amber-700 mt-1">
          What are we cooking today?
        </p>
      </section>

      {/* Quick Actions */}
      <section className="px-6 mb-8">
        <div className="grid grid-cols-2 gap-4">
          <Link
            to="/recipes/new"
            className="bg-amber-600 text-white rounded-2xl p-6 flex flex-col items-center justify-center gap-2 shadow-lg hover:bg-amber-700 transition-colors"
          >
            <ChefHat className="w-8 h-8" />
            <span className="font-medium">Add Recipe</span>
          </Link>
          <Link
            to="/family/$familyId"
            params={{ familyId: family.id }}
            className="bg-white text-amber-900 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 shadow-sm border border-amber-100 hover:border-amber-200 transition-colors"
          >
            <Users className="w-8 h-8" />
            <span className="font-medium">Family</span>
          </Link>
        </div>
      </section>

      {/* Recipe List */}
      <section className="px-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
          </div>
        ) : recipes && recipes.length > 0 ? (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Family Recipes
              <span className="text-gray-400 font-normal ml-2">({recipes.length})</span>
            </h2>
            <div className="space-y-4">
              {recipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          </div>
        ) : (
          <EmptyRecipeState />
        )}
      </section>
    </div>
  )
}

function RecipeCard({ recipe }: { recipe: Recipe & { attributions?: Array<{ family_member?: { name: string } }> } }) {
  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0)
  const attribution = recipe.attributions?.[0]?.family_member?.name

  return (
    <Link
      to="/recipes/$recipeId"
      params={{ recipeId: recipe.id }}
      className="block bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
    >
      {recipe.hero_image_url && (
        <div className="h-40 bg-amber-100">
          <img
            src={recipe.hero_image_url}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1">{recipe.title}</h3>
        {attribution && (
          <p className="text-sm text-amber-600 mb-2">From {attribution}'s kitchen</p>
        )}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          {totalTime > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {totalTime} min
            </span>
          )}
          {recipe.difficulty && (
            <span className="capitalize">{recipe.difficulty}</span>
          )}
          {recipe.origin_year && (
            <span>Since {recipe.origin_year}</span>
          )}
        </div>
      </div>
    </Link>
  )
}

function EmptyRecipeState() {
  return (
    <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
      <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <BookOpen className="w-8 h-8 text-amber-600" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">
        No recipes yet
      </h2>
      <p className="text-gray-600 mb-6">
        Start preserving your family's culinary heritage by adding your first recipe.
      </p>
      <Link
        to="/recipes/new"
        className="inline-flex items-center gap-2 px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-xl transition-colors"
      >
        <ChefHat className="w-5 h-5" />
        Add Your First Recipe
      </Link>
    </div>
  )
}

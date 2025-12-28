import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useRecipe, useDeleteRecipe } from '../../hooks/useRecipes'
import {
  ArrowLeft,
  Clock,
  Users,
  ChefHat,
  MapPin,
  Calendar,
  Play,
  Trash2,
  Loader2,
  Check,
} from 'lucide-react'

export const Route = createFileRoute('/recipes/$recipeId')({
  component: RecipeDetailPage,
})

function RecipeDetailPage() {
  const { recipeId } = Route.useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { data: recipe, isLoading, error } = useRecipe(recipeId)
  const deleteRecipe = useDeleteRecipe()
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (!authLoading && !user) {
    navigate({ to: '/login' })
    return null
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    )
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Recipe not found</h1>
          <p className="text-gray-600 mb-4">This recipe doesn't exist or you don't have access.</p>
          <Link to="/" className="text-amber-600 hover:text-amber-700 font-medium">
            Go home
          </Link>
        </div>
      </div>
    )
  }

  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0)
  const attribution = recipe.attributions?.[0]?.family_member

  function toggleIngredient(id: string) {
    const newChecked = new Set(checkedIngredients)
    if (newChecked.has(id)) {
      newChecked.delete(id)
    } else {
      newChecked.add(id)
    }
    setCheckedIngredients(newChecked)
  }

  async function handleDelete() {
    const { error } = await deleteRecipe.mutateAsync({
      recipeId: recipe.id,
      familyId: recipe.family_id,
    })

    if (error) {
      alert('Failed to delete recipe')
      return
    }

    navigate({ to: '/' })
  }

  // Sort ingredients and steps by order_index
  const sortedIngredients = [...(recipe.ingredients || [])].sort(
    (a, b) => a.order_index - b.order_index
  )
  const sortedSteps = [...(recipe.steps || [])].sort(
    (a, b) => a.order_index - b.order_index
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 pb-24 md:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-amber-100 px-4 py-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <Link
            to="/"
            className="flex items-center gap-1 text-amber-600 hover:text-amber-700"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/recipes/$recipeId/cook"
              params={{ recipeId: recipe.id }}
              className="flex items-center gap-1 px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors text-sm"
            >
              <Play className="w-4 h-4" />
              Cook
            </Link>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-2xl mx-auto">
        {/* Title & Description */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{recipe.title}</h1>
        {recipe.description && (
          <p className="text-gray-600 mb-4">{recipe.description}</p>
        )}

        {/* Attribution */}
        {attribution && (
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
              <ChefHat className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">
                From <span className="font-medium text-gray-900">{attribution.name}</span>
                {attribution.is_deceased && "'s kitchen"}
              </p>
            </div>
          </div>
        )}

        {/* Meta Info */}
        <div className="flex flex-wrap gap-4 mb-6">
          {totalTime > 0 && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{totalTime} min</span>
              {recipe.prep_time && recipe.cook_time && (
                <span className="text-gray-400">
                  ({recipe.prep_time} prep + {recipe.cook_time} cook)
                </span>
              )}
            </div>
          )}
          {recipe.servings && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              <span>Serves {recipe.servings}</span>
            </div>
          )}
          {recipe.difficulty && (
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                recipe.difficulty === 'easy'
                  ? 'bg-green-100 text-green-700'
                  : recipe.difficulty === 'medium'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
              }`}
            >
              {recipe.difficulty}
            </span>
          )}
        </div>

        {/* Origin Info */}
        {(recipe.origin_year || recipe.origin_location) && (
          <div className="bg-amber-50 rounded-xl p-4 mb-6">
            <div className="flex flex-wrap gap-4 text-sm">
              {recipe.origin_year && (
                <div className="flex items-center gap-1 text-amber-800">
                  <Calendar className="w-4 h-4" />
                  <span>Family since {recipe.origin_year}</span>
                </div>
              )}
              {recipe.origin_location && (
                <div className="flex items-center gap-1 text-amber-800">
                  <MapPin className="w-4 h-4" />
                  <span>{recipe.origin_location}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Origin Story */}
        {recipe.origin_story && (
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
            <h2 className="font-semibold text-gray-900 mb-2">The Story</h2>
            <p className="text-gray-600 italic">"{recipe.origin_story}"</p>
          </div>
        )}

        {/* Ingredients */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            Ingredients
            <span className="text-gray-400 font-normal ml-2">
              ({sortedIngredients.length})
            </span>
          </h2>
          <ul className="space-y-2">
            {sortedIngredients.map((ingredient) => (
              <li key={ingredient.id}>
                <button
                  onClick={() => toggleIngredient(ingredient.id)}
                  className="flex items-center gap-3 w-full text-left py-1"
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      checkedIngredients.has(ingredient.id)
                        ? 'bg-amber-600 border-amber-600'
                        : 'border-gray-300'
                    }`}
                  >
                    {checkedIngredients.has(ingredient.id) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span
                    className={`${
                      checkedIngredients.has(ingredient.id)
                        ? 'text-gray-400 line-through'
                        : 'text-gray-700'
                    }`}
                  >
                    {ingredient.text}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Steps */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Instructions</h2>
          <ol className="space-y-4">
            {sortedSteps.map((step, index) => (
              <li key={step.id} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-medium text-sm flex-shrink-0">
                  {index + 1}
                </div>
                <p className="text-gray-700 pt-0.5">{step.instruction}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Cook Mode CTA */}
        <Link
          to="/recipes/$recipeId/cook"
          params={{ recipeId: recipe.id }}
          className="block w-full py-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-2xl text-center transition-colors shadow-lg"
        >
          <Play className="w-5 h-5 inline mr-2" />
          Start Cooking
        </Link>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Delete Recipe?</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{recipe.title}"? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteRecipe.isPending}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                {deleteRecipe.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

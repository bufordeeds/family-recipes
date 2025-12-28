import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useUserFamilies, useFamilyMembers } from '../../hooks/useFamily'
import { useCreateRecipe } from '../../hooks/useRecipes'
import {
  ArrowLeft,
  Plus,
  X,
  Loader2,
  Clock,
  Users,
  ChefHat,
  GripVertical,
} from 'lucide-react'

export const Route = createFileRoute('/recipes/new')({
  component: NewRecipePage,
})

function NewRecipePage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { data: families, isLoading: familiesLoading } = useUserFamilies()
  const family = families?.[0]
  const { data: members } = useFamilyMembers(family?.id)
  const createRecipe = useCreateRecipe()

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [originStory, setOriginStory] = useState('')
  const [ingredients, setIngredients] = useState<string[]>([''])
  const [steps, setSteps] = useState<string[]>([''])
  const [prepTime, setPrepTime] = useState('')
  const [cookTime, setCookTime] = useState('')
  const [servings, setServings] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | ''>('')
  const [attributedTo, setAttributedTo] = useState('')
  const [showOptional, setShowOptional] = useState(false)

  if (!authLoading && !user) {
    navigate({ to: '/login' })
    return null
  }

  if (authLoading || familiesLoading) {
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

  function addIngredient() {
    setIngredients([...ingredients, ''])
  }

  function updateIngredient(index: number, value: string) {
    const updated = [...ingredients]
    updated[index] = value
    setIngredients(updated)
  }

  function removeIngredient(index: number) {
    if (ingredients.length === 1) return
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  function addStep() {
    setSteps([...steps, ''])
  }

  function updateStep(index: number, value: string) {
    const updated = [...steps]
    updated[index] = value
    setSteps(updated)
  }

  function removeStep(index: number) {
    if (steps.length === 1) return
    setSteps(steps.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const filteredIngredients = ingredients.filter((i) => i.trim())
    const filteredSteps = steps.filter((s) => s.trim())

    if (!title.trim()) {
      alert('Please enter a recipe title')
      return
    }

    if (filteredIngredients.length === 0) {
      alert('Please add at least one ingredient')
      return
    }

    if (filteredSteps.length === 0) {
      alert('Please add at least one step')
      return
    }

    const { data, error } = await createRecipe.mutateAsync({
      familyId: family.id,
      title: title.trim(),
      description: description.trim() || undefined,
      originStory: originStory.trim() || undefined,
      prepTime: prepTime ? parseInt(prepTime) : undefined,
      cookTime: cookTime ? parseInt(cookTime) : undefined,
      servings: servings ? parseInt(servings) : undefined,
      difficulty: difficulty || undefined,
      ingredients: filteredIngredients,
      steps: filteredSteps,
      attributedTo: attributedTo || undefined,
    })

    if (error) {
      alert(error.message)
      return
    }

    if (data) {
      navigate({ to: '/recipes/$recipeId', params: { recipeId: data.id } })
    }
  }

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
            <span className="font-medium">Cancel</span>
          </Link>
          <h1 className="font-semibold text-gray-900">Add Recipe</h1>
          <button
            onClick={handleSubmit}
            disabled={createRecipe.isPending}
            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 text-sm"
          >
            {createRecipe.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        {/* Title */}
        <div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Recipe name"
            required
            className="w-full text-2xl font-bold text-gray-900 bg-transparent border-0 border-b-2 border-amber-200 focus:border-amber-500 outline-none pb-2 placeholder:text-gray-400"
          />
        </div>

        {/* Description */}
        <div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a short description..."
            rows={2}
            className="w-full text-gray-700 bg-transparent border-0 border-b border-gray-200 focus:border-amber-500 outline-none resize-none placeholder:text-gray-400"
          />
        </div>

        {/* Attribution */}
        {members && members.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <ChefHat className="w-4 h-4 inline mr-1" />
              Who's recipe is this?
            </label>
            <select
              value={attributedTo}
              onChange={(e) => setAttributedTo(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none bg-white"
            >
              <option value="">Select family member (optional)</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                  {member.is_deceased ? ' (in memory)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Ingredients */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Ingredients</h2>
          <div className="space-y-2">
            {ingredients.map((ingredient, index) => (
              <div key={index} className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
                <input
                  type="text"
                  value={ingredient}
                  onChange={(e) => updateIngredient(index, e.target.value)}
                  placeholder={`Ingredient ${index + 1}`}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeIngredient(index)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  disabled={ingredients.length === 1}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addIngredient}
            className="mt-3 flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Add ingredient
          </button>
        </div>

        {/* Steps */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Instructions</h2>
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={index} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-medium text-sm flex-shrink-0 mt-2">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <textarea
                    value={step}
                    onChange={(e) => updateStep(index, e.target.value)}
                    placeholder={`Step ${index + 1}`}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none resize-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeStep(index)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  disabled={steps.length === 1}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addStep}
            className="mt-3 flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Add step
          </button>
        </div>

        {/* Optional Fields Toggle */}
        <button
          type="button"
          onClick={() => setShowOptional(!showOptional)}
          className="w-full text-center text-amber-600 hover:text-amber-700 font-medium text-sm py-2"
        >
          {showOptional ? 'Hide' : 'Show'} optional details
        </button>

        {showOptional && (
          <>
            {/* Time & Servings */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-4">Time & Servings</h2>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    <Clock className="w-3 h-3 inline mr-1" />
                    Prep
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={prepTime}
                      onChange={(e) => setPrepTime(e.target.value)}
                      placeholder="0"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                    />
                    <span className="ml-1 text-xs text-gray-500">min</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    <Clock className="w-3 h-3 inline mr-1" />
                    Cook
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={cookTime}
                      onChange={(e) => setCookTime(e.target.value)}
                      placeholder="0"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                    />
                    <span className="ml-1 text-xs text-gray-500">min</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    <Users className="w-3 h-3 inline mr-1" />
                    Serves
                  </label>
                  <input
                    type="number"
                    value={servings}
                    onChange={(e) => setServings(e.target.value)}
                    placeholder="0"
                    min="1"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-xs text-gray-500 mb-2">Difficulty</label>
                <div className="flex gap-2">
                  {(['easy', 'medium', 'hard'] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setDifficulty(difficulty === level ? '' : level)}
                      className={`flex-1 py-2 rounded-lg font-medium text-sm capitalize transition-colors ${
                        difficulty === level
                          ? 'bg-amber-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Origin Story */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-2">Origin Story</h2>
              <p className="text-sm text-gray-500 mb-3">
                Share the history behind this recipe
              </p>
              <textarea
                value={originStory}
                onChange={(e) => setOriginStory(e.target.value)}
                placeholder="This recipe has been in our family since..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none resize-none"
              />
            </div>
          </>
        )}
      </form>
    </div>
  )
}

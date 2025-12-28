import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useRecipe } from '../../hooks/useRecipes'
import {
  X,
  ChevronLeft,
  ChevronRight,
  Timer,
  Pause,
  Play,
  RotateCcw,
  Loader2,
  Check,
} from 'lucide-react'

export const Route = createFileRoute('/recipes/$recipeId/cook')({
  component: CookModePage,
})

function CookModePage() {
  const { recipeId } = Route.useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { data: recipe, isLoading } = useRecipe(recipeId)
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  // Keep screen awake
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null

    async function requestWakeLock() {
      if ('wakeLock' in navigator) {
        try {
          wakeLock = await navigator.wakeLock.request('screen')
        } catch (err) {
          console.log('Wake lock request failed')
        }
      }
    }

    requestWakeLock()

    return () => {
      if (wakeLock) {
        wakeLock.release()
      }
    }
  }, [])

  if (!authLoading && !user) {
    navigate({ to: '/login' })
    return null
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <p>Recipe not found</p>
      </div>
    )
  }

  const sortedSteps = [...(recipe.steps || [])].sort(
    (a, b) => a.order_index - b.order_index
  )
  const totalSteps = sortedSteps.length
  const currentStepData = sortedSteps[currentStep]

  function goToNextStep() {
    if (currentStep < totalSteps - 1) {
      setCompletedSteps((prev) => new Set([...prev, currentStep]))
      setCurrentStep(currentStep + 1)
    }
  }

  function goToPrevStep() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  function toggleStepComplete() {
    const newCompleted = new Set(completedSteps)
    if (newCompleted.has(currentStep)) {
      newCompleted.delete(currentStep)
    } else {
      newCompleted.add(currentStep)
    }
    setCompletedSteps(newCompleted)
  }

  const isLastStep = currentStep === totalSteps - 1
  const isFirstStep = currentStep === 0
  const isStepComplete = completedSteps.has(currentStep)

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
        <Link
          to="/recipes/$recipeId"
          params={{ recipeId: recipe.id }}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <X className="w-6 h-6" />
        </Link>
        <div className="text-center">
          <h1 className="font-semibold text-lg">{recipe.title}</h1>
          <p className="text-sm text-gray-400">
            Step {currentStep + 1} of {totalSteps}
          </p>
        </div>
        <button
          onClick={toggleStepComplete}
          className={`p-2 rounded-lg transition-colors ${
            isStepComplete
              ? 'bg-green-600 hover:bg-green-700'
              : 'hover:bg-gray-800'
          }`}
        >
          <Check className="w-6 h-6" />
        </button>
      </header>

      {/* Progress Bar */}
      <div className="h-1 bg-gray-800">
        <div
          className="h-full bg-amber-500 transition-all duration-300"
          style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
        />
      </div>

      {/* Step Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="max-w-lg w-full text-center">
          {/* Step Number */}
          <div className="w-16 h-16 rounded-full bg-amber-500 text-gray-900 flex items-center justify-center text-2xl font-bold mx-auto mb-8">
            {currentStep + 1}
          </div>

          {/* Instruction */}
          <p className="text-2xl leading-relaxed mb-8">
            {currentStepData?.instruction}
          </p>

          {/* Step Image */}
          {currentStepData?.image_url && (
            <div className="rounded-2xl overflow-hidden mb-8">
              <img
                src={currentStepData.image_url}
                alt={`Step ${currentStep + 1}`}
                className="w-full"
              />
            </div>
          )}

          {/* Timer Button (placeholder - could detect time mentions) */}
          <TimerWidget />
        </div>
      </main>

      {/* Navigation */}
      <footer className="px-4 py-6 border-t border-gray-800">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button
            onClick={goToPrevStep}
            disabled={isFirstStep}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${
              isFirstStep
                ? 'text-gray-600 cursor-not-allowed'
                : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          {isLastStep ? (
            <Link
              to="/recipes/$recipeId"
              params={{ recipeId: recipe.id }}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-xl font-medium transition-colors"
            >
              <Check className="w-5 h-5" />
              Done!
            </Link>
          ) : (
            <button
              onClick={goToNextStep}
              className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-gray-900 rounded-xl font-medium transition-colors"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}

function TimerWidget() {
  const [timerMinutes, setTimerMinutes] = useState(5)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [showTimer, setShowTimer] = useState(false)

  const resetTimer = useCallback(() => {
    setTimerSeconds(timerMinutes * 60)
    setIsRunning(false)
  }, [timerMinutes])

  useEffect(() => {
    let interval: number | undefined

    if (isRunning && timerSeconds > 0) {
      interval = window.setInterval(() => {
        setTimerSeconds((s) => s - 1)
      }, 1000)
    } else if (timerSeconds === 0 && isRunning) {
      setIsRunning(false)
      // Play sound or vibrate
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 200])
      }
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, timerSeconds])

  if (!showTimer) {
    return (
      <button
        onClick={() => {
          setShowTimer(true)
          setTimerSeconds(timerMinutes * 60)
        }}
        className="flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-medium transition-colors mx-auto"
      >
        <Timer className="w-5 h-5" />
        Set Timer
      </button>
    )
  }

  const displayMinutes = Math.floor(timerSeconds / 60)
  const displaySeconds = timerSeconds % 60

  return (
    <div className="bg-gray-800 rounded-2xl p-6 max-w-xs mx-auto">
      {/* Timer Display */}
      <div className="text-5xl font-mono font-bold mb-4">
        {String(displayMinutes).padStart(2, '0')}:
        {String(displaySeconds).padStart(2, '0')}
      </div>

      {/* Timer Controls */}
      <div className="flex items-center justify-center gap-4">
        {!isRunning && timerSeconds === timerMinutes * 60 && (
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setTimerMinutes(Math.max(1, timerMinutes - 1))}
              className="w-10 h-10 rounded-lg bg-gray-700 hover:bg-gray-600"
            >
              -
            </button>
            <span className="w-16 text-center">{timerMinutes} min</span>
            <button
              onClick={() => setTimerMinutes(timerMinutes + 1)}
              className="w-10 h-10 rounded-lg bg-gray-700 hover:bg-gray-600"
            >
              +
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={resetTimer}
          className="p-3 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        <button
          onClick={() => {
            if (!isRunning && timerSeconds === 0) {
              setTimerSeconds(timerMinutes * 60)
            }
            setIsRunning(!isRunning)
          }}
          className={`p-3 rounded-xl transition-colors ${
            isRunning
              ? 'bg-amber-500 hover:bg-amber-600 text-gray-900'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>
        <button
          onClick={() => setShowTimer(false)}
          className="p-3 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

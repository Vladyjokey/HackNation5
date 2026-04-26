import { Check, FileText, Search, ClipboardList, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Stage } from '../types'

interface ProgressIndicatorProps {
  currentStage: Stage
  highestStageReached?: Stage
  onStageClick?: (stage: Stage) => void
}

const stages = [
  { id: 'input', label: 'Hypothesis', icon: FileText },
  { id: 'literature-qc', label: 'Literature QC', icon: Search },
  { id: 'experiment-plan', label: 'Experiment Plan', icon: ClipboardList },
  { id: 'review', label: 'Review', icon: MessageSquare },
] as const

export function ProgressIndicator({ currentStage, highestStageReached, onStageClick }: ProgressIndicatorProps) {
  const currentIndex = stages.findIndex((s) => s.id === currentStage)
  const highestIndex = highestStageReached 
    ? stages.findIndex((s) => s.id === highestStageReached)
    : currentIndex

  const handleStageClick = (stageId: Stage, index: number) => {
    // Allow clicking on any stage up to the highest reached
    if (index <= highestIndex && onStageClick) {
      onStageClick(stageId)
    }
  }

  return (
    <div className="flex items-center justify-center">
      <div className="flex items-center gap-2 md:gap-4">
        {stages.map((stage, index) => {
          const isCompleted = index < currentIndex
          const isCurrent = index === currentIndex
          const isReached = index <= highestIndex
          const isClickable = isReached && onStageClick
          const Icon = stage.icon

          return (
            <div key={stage.id} className="flex items-center">
              <button
                type="button"
                onClick={() => handleStageClick(stage.id as Stage, index)}
                disabled={!isClickable}
                className={cn(
                  "flex flex-col items-center gap-2 transition-all",
                  isClickable && "cursor-pointer hover:scale-105",
                  !isClickable && "cursor-default"
                )}
              >
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all',
                    isCompleted && 'border-primary bg-primary text-primary-foreground',
                    isCurrent && 'border-primary bg-background text-primary',
                    !isCompleted && !isCurrent && isReached && 'border-primary/50 bg-primary/10 text-primary',
                    !isCompleted && !isCurrent && !isReached && 'border-muted bg-background text-muted-foreground',
                    isClickable && 'hover:ring-2 hover:ring-primary/30 hover:ring-offset-2'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium hidden md:block transition-colors',
                    isCurrent ? 'text-foreground' : 'text-muted-foreground',
                    isClickable && 'hover:text-primary'
                  )}
                >
                  {stage.label}
                </span>
              </button>
              
              {index < stages.length - 1 && (
                <div
                  className={cn(
                    'mx-2 h-0.5 w-8 md:w-16 lg:w-24',
                    index < currentIndex ? 'bg-primary' : index < highestIndex ? 'bg-primary/40' : 'bg-muted'
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

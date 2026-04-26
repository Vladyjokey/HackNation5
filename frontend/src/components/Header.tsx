import { FlaskConical, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from './ThemeToggle'

interface HeaderProps {
  onReset: () => void
  showReset: boolean
}

export function Header({ onReset, showReset }: HeaderProps) {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur-sm relative z-20">
      <div className="container mx-auto px-4 py-4 max-w-6xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <FlaskConical className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">LabPlan AI</h1>
              <p className="text-sm text-muted-foreground">Scientific Experiment Planning</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {showReset && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onReset}
                className="border-border hover:bg-muted/50"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Start Over
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

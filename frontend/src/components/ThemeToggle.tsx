import { Sun, Moon, Terminal, Atom } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme, type Theme } from './ThemeProvider'
import { cn } from '@/lib/utils'

const themes: { value: Theme; label: string; icon: typeof Sun; description: string }[] = [
  {
    value: 'light',
    label: 'Light',
    icon: Sun,
    description: 'Clean and professional',
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: Moon,
    description: 'Easy on the eyes',
  },
  {
    value: 'scientific',
    label: 'Scientific',
    icon: Atom,
    description: 'Laboratory aesthetic',
  },
  {
    value: 'hacker',
    label: 'Hacker',
    icon: Terminal,
    description: 'Hackathon mode',
  },
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const currentTheme = themes.find((t) => t.value === theme) || themes[0]
  const CurrentIcon = currentTheme.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          className={cn(
            "relative overflow-hidden transition-all duration-300",
            theme === 'hacker' && "border-primary animate-pulse",
            theme === 'scientific' && "border-cyan-500/50 hover:border-cyan-400"
          )}
        >
          <CurrentIcon className={cn(
            "h-4 w-4 transition-transform duration-300",
            theme === 'hacker' && "text-primary",
            theme === 'scientific' && "text-cyan-500 animate-spin-slow"
          )} />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {themes.map((t) => {
          const Icon = t.icon
          return (
            <DropdownMenuItem
              key={t.value}
              onClick={() => setTheme(t.value)}
              className={cn(
                "flex items-center gap-3 cursor-pointer",
                theme === t.value && "bg-accent"
              )}
            >
              <Icon className={cn(
                "h-4 w-4",
                t.value === 'hacker' && "text-green-500",
                t.value === 'scientific' && "text-cyan-500"
              )} />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{t.label}</span>
                <span className="text-xs text-muted-foreground">{t.description}</span>
              </div>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

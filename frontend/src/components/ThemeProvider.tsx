import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Theme = 'light' | 'dark' | 'hacker' | 'scientific'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  storageKey = 'labplan-theme',
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey) as Theme | null
      if (stored && ['light', 'dark', 'hacker', 'scientific'].includes(stored)) {
        return stored
      }
    }
    return defaultTheme
  })

  useEffect(() => {
    const root = window.document.documentElement
    
    // Remove all theme classes
    root.classList.remove('light', 'dark', 'hacker', 'scientific')
    
    // Add the current theme class
    root.classList.add(theme)
    
    // Store preference
    localStorage.setItem(storageKey, theme)
  }, [theme, storageKey])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

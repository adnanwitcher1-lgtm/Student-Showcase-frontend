import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const ThemeContext = createContext()

function read(key, fallback) {
  try {
    const v = localStorage.getItem(key)
    return v === null ? fallback : v
  } catch {
    return fallback
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* storage blocked: ignore */
  }
}

export function ThemeProvider({ children }) {
  // Dark is the default look
  const [isDark, setIsDark] = useState(() => read('theme', 'dark') === 'dark')
  const [reduceMotion, setReduceMotion] = useState(() => read('reduce_motion', '0') === '1')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    write('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reduceMotion)
    write('reduce_motion', reduceMotion ? '1' : '0')
  }, [reduceMotion])

  const toggleTheme = useCallback(() => setIsDark((d) => !d), [])
  const setTheme = useCallback((mode) => setIsDark(mode === 'dark'), [])

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, setTheme, reduceMotion, setReduceMotion }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}

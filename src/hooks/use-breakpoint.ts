import { useState, useEffect } from 'react'

export type Breakpoint = 'mobile' | 'tablet' | 'desktop'

const TABLET_MIN = 640
const DESKTOP_MIN = 1024

function getBreakpoint(): Breakpoint {
  const width = window.innerWidth
  if (width < TABLET_MIN) return 'mobile'
  if (width < DESKTOP_MIN) return 'tablet'
  return 'desktop'
}

export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('desktop')

  useEffect(() => {
    // Set initial value on mount
    setBreakpoint(getBreakpoint())

    const tabletMql = window.matchMedia(`(min-width: ${TABLET_MIN}px)`)
    const desktopMql = window.matchMedia(`(min-width: ${DESKTOP_MIN}px)`)

    const onChange = () => {
      setBreakpoint(getBreakpoint())
    }

    tabletMql.addEventListener('change', onChange)
    desktopMql.addEventListener('change', onChange)

    return () => {
      tabletMql.removeEventListener('change', onChange)
      desktopMql.removeEventListener('change', onChange)
    }
  }, [])

  return breakpoint
}

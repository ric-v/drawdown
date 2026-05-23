/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react'
import { useBreakpoint } from '../use-breakpoint'

describe('useBreakpoint', () => {
  let listeners: Map<string, Set<() => void>>

  function setupMatchMedia(width: number) {
    listeners = new Map()

    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    })

    window.matchMedia = jest.fn().mockImplementation((query: string) => {
      if (!listeners.has(query)) {
        listeners.set(query, new Set())
      }
      const queryListeners = listeners.get(query)!
      return {
        matches: false,
        media: query,
        addEventListener: (_event: string, handler: () => void) => {
          queryListeners.add(handler)
        },
        removeEventListener: (_event: string, handler: () => void) => {
          queryListeners.delete(handler)
        },
        addListener: jest.fn(),
        removeListener: jest.fn(),
        onchange: null,
        dispatchEvent: jest.fn(),
      }
    })
  }

  function setWidth(width: number) {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    })
  }

  function fireChangeEvents() {
    listeners.forEach((handlerSet) => {
      handlerSet.forEach((handler) => handler())
    })
  }

  beforeEach(() => {
    setupMatchMedia(1200)
  })

  it('returns "mobile" when viewport is below 640px', () => {
    setWidth(400)
    const { result } = renderHook(() => useBreakpoint())
    expect(result.current).toBe('mobile')
  })

  it('returns "tablet" when viewport is between 640px and 1023px', () => {
    setWidth(800)
    const { result } = renderHook(() => useBreakpoint())
    expect(result.current).toBe('tablet')
  })

  it('returns "desktop" when viewport is 1024px or greater', () => {
    setWidth(1200)
    const { result } = renderHook(() => useBreakpoint())
    expect(result.current).toBe('desktop')
  })

  it('returns "tablet" at exactly 640px', () => {
    setWidth(640)
    const { result } = renderHook(() => useBreakpoint())
    expect(result.current).toBe('tablet')
  })

  it('returns "desktop" at exactly 1024px', () => {
    setWidth(1024)
    const { result } = renderHook(() => useBreakpoint())
    expect(result.current).toBe('desktop')
  })

  it('updates when viewport crosses a breakpoint boundary', () => {
    setWidth(1200)
    const { result } = renderHook(() => useBreakpoint())
    expect(result.current).toBe('desktop')

    act(() => {
      setWidth(800)
      fireChangeEvents()
    })
    expect(result.current).toBe('tablet')

    act(() => {
      setWidth(400)
      fireChangeEvents()
    })
    expect(result.current).toBe('mobile')
  })

  it('cleans up matchMedia listeners on unmount', () => {
    setWidth(1200)
    const { unmount } = renderHook(() => useBreakpoint())

    unmount()

    listeners.forEach((handlerSet) => {
      expect(handlerSet.size).toBe(0)
    })
  })
})

import { useCallback, useRef } from 'react'

export interface VideoLoadQueue {
  register: (id: string, el: HTMLVideoElement, srcUrl: string) => void
  unregister: (id: string) => void
  prioritize: (id: string) => void
}

interface Entry {
  el: HTMLVideoElement
  srcUrl: string
  loaded: boolean
  loading: boolean
}

export function useVideoLoadQueue(): VideoLoadQueue {
  const entries = useRef<Map<string, Entry>>(new Map())
  const scheduled = useRef(false)
  const scrollBound = useRef(false)
  const rafId = useRef(0)
  const currentlyLoading = useRef<string | null>(null)

  const distanceFromViewport = (el: HTMLElement): number => {
    const rect = el.getBoundingClientRect()
    const viewportCenterY = window.innerHeight / 2
    const elCenterY = (rect.top + rect.bottom) / 2
    // Also factor in horizontal distance for off-screen items in scroll rows
    const viewportCenterX = window.innerWidth / 2
    const elCenterX = (rect.left + rect.right) / 2
    return Math.sqrt((elCenterY - viewportCenterY) ** 2 + (elCenterX - viewportCenterX) ** 2)
  }

  const allDone = (): boolean => {
    for (const entry of entries.current.values()) {
      if (!entry.loaded) return false
    }
    return true
  }

  const detachScroll = () => {
    if (scrollBound.current) {
      window.removeEventListener('scroll', onScroll, true)
      scrollBound.current = false
    }
  }

  const loadNext = () => {
    // If something is currently loading, don't start another
    if (currentlyLoading.current) return

    // Find the closest unloaded video
    let bestId: string | null = null
    let bestDist = Infinity
    for (const [id, entry] of entries.current) {
      if (entry.loaded || entry.loading) continue
      const dist = distanceFromViewport(entry.el)
      if (dist < bestDist) {
        bestDist = dist
        bestId = id
      }
    }

    if (!bestId) return
    startLoad(bestId)
  }

  const startLoad = (id: string) => {
    const entry = entries.current.get(id)
    if (!entry || entry.loaded || entry.loading) return

    entry.loading = true
    currentlyLoading.current = id

    const onCanPlay = () => {
      entry.el.removeEventListener('canplay', onCanPlay)
      entry.loaded = true
      entry.loading = false
      currentlyLoading.current = null

      // Start playback
      entry.el.play().catch(() => {})

      // Load next video
      if (allDone()) {
        detachScroll()
      } else {
        loadNext()
      }
    }

    entry.el.addEventListener('canplay', onCanPlay)
    entry.el.src = entry.srcUrl
    entry.el.preload = 'auto'
    entry.el.load()
  }

  const onScroll = () => {
    // RAF-throttled: only re-evaluate if nothing is loading
    if (rafId.current) return
    rafId.current = requestAnimationFrame(() => {
      rafId.current = 0
      if (!currentlyLoading.current) {
        loadNext()
      }
    })
  }

  const ensureScrollListener = () => {
    if (!scrollBound.current) {
      // Use capture so we catch scrolls on the horizontal media rows too
      window.addEventListener('scroll', onScroll, true)
      scrollBound.current = true
    }
  }

  const scheduleFirstLoad = () => {
    if (scheduled.current) return
    scheduled.current = true
    // Defer so all videos register in the same React commit before we sort
    queueMicrotask(() => {
      ensureScrollListener()
      loadNext()
    })
  }

  const register = useCallback((id: string, el: HTMLVideoElement, srcUrl: string) => {
    entries.current.set(id, { el, srcUrl, loaded: false, loading: false })
    scheduleFirstLoad()
  }, [])

  const unregister = useCallback((id: string) => {
    const entry = entries.current.get(id)
    if (entry && currentlyLoading.current === id) {
      currentlyLoading.current = null
    }
    entries.current.delete(id)
  }, [])

  const prioritize = useCallback((id: string) => {
    const entry = entries.current.get(id)
    if (!entry || entry.loaded || entry.loading) return
    // Force-load this video immediately (don't abort current — just queue it next)
    startLoad(id)
  }, [])

  return { register, unregister, prioritize }
}

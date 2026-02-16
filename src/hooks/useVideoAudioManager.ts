import { useState, useCallback, useRef, useEffect } from 'react'

export interface AudioManager {
  soundEnabled: boolean
  focusedVideoId: string | null
  toggleSound: () => void
  register: (id: string, el: HTMLVideoElement) => void
  unregister: (id: string) => void
}

export function useVideoAudioManager(): AudioManager {
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [focusedVideoId, setFocusedVideoId] = useState<string | null>(null)

  const videosRef = useRef<Map<string, HTMLVideoElement>>(new Map())
  const ratiosRef = useRef<Map<string, number>>(new Map())
  const observerRef = useRef<IntersectionObserver | null>(null)

  const pickFocused = useCallback(() => {
    let bestId: string | null = null
    let bestRatio = 0.3 // minimum threshold
    for (const [id, ratio] of ratiosRef.current) {
      if (ratio > bestRatio) {
        bestRatio = ratio
        bestId = id
      }
    }
    setFocusedVideoId(bestId)
  }, [])

  // Create observer once
  useEffect(() => {
    const thresholds = Array.from({ length: 21 }, (_, i) => i * 0.05)
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset.audioId
          if (id) {
            ratiosRef.current.set(id, entry.intersectionRatio)
          }
        }
        pickFocused()
      },
      { thresholds }
    )
    return () => {
      observerRef.current?.disconnect()
    }
  }, [pickFocused])

  const register = useCallback((id: string, el: HTMLVideoElement) => {
    videosRef.current.set(id, el)
    el.dataset.audioId = id
    observerRef.current?.observe(el)
  }, [])

  const unregister = useCallback((id: string) => {
    const el = videosRef.current.get(id)
    if (el) {
      observerRef.current?.unobserve(el)
      delete el.dataset.audioId
    }
    videosRef.current.delete(id)
    ratiosRef.current.delete(id)
    pickFocused()
  }, [pickFocused])

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => !prev)
  }, [])

  // Imperatively set muted on all tracked videos
  useEffect(() => {
    for (const [id, el] of videosRef.current) {
      el.muted = !(soundEnabled && focusedVideoId === id)
    }
  }, [soundEnabled, focusedVideoId])

  return { soundEnabled, focusedVideoId, toggleSound, register, unregister }
}

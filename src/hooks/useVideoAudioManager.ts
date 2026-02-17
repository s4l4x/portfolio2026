import { useState, useCallback, useRef, useEffect } from 'react'

export interface AudioManager {
  soundEnabled: boolean
  focusedVideoId: string | null
  toggleSound: () => void
  releaseFocus: () => void
  register: (id: string, el: HTMLVideoElement) => void
  unregister: (id: string) => void
}

export function useVideoAudioManager(): AudioManager {
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [focusedVideoId, setFocusedVideoId] = useState<string | null>(null)

  const videosRef = useRef<Map<string, HTMLVideoElement>>(new Map())
  const ratiosRef = useRef<Map<string, number>>(new Map())
  const observerRef = useRef<IntersectionObserver | null>(null)
  const focusedRef = useRef<string | null>(null)
  const soundRef = useRef(false)

  // Imperatively sync el.muted on all tracked videos.
  // Unmutes the focused video BEFORE muting others so there is never a gap in
  // audio output — this prevents the browser tab speaker icon from flickering.
  const applyMutedStates = useCallback(() => {
    const sound = soundRef.current
    const focused = focusedRef.current

    // 1. Unmute the focused video first (no audio gap)
    if (sound && focused) {
      const el = videosRef.current.get(focused)
      if (el && el.muted) el.muted = false
    }

    // 2. Then mute everything else
    for (const [id, el] of videosRef.current) {
      const shouldMute = !(sound && focused === id)
      if (el.muted !== shouldMute) el.muted = shouldMute
    }
  }, [])

  const pickFocused = useCallback(() => {
    let bestId: string | null = null
    let bestRatio = 0.3 // minimum threshold
    for (const [id, ratio] of ratiosRef.current) {
      if (ratio > bestRatio) {
        bestRatio = ratio
        bestId = id
      }
    }

    // No change — skip entirely
    if (bestId === focusedRef.current) return

    // Hysteresis: if the current focused video is still reasonably visible,
    // require the new candidate to be significantly more visible before we
    // switch.  This prevents two similarly-visible videos from rapidly trading
    // focus on every IntersectionObserver tick, which was causing the browser
    // to cycle audio on/off (choppy sound + flashing tab speaker icon).
    const prev = focusedRef.current
    if (prev) {
      const prevRatio = ratiosRef.current.get(prev) ?? 0
      if (prevRatio > 0.3 && bestRatio - prevRatio < 0.15) return
    }

    focusedRef.current = bestId
    setFocusedVideoId(bestId)
    applyMutedStates()
  }, [applyMutedStates])

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
    const next = !soundRef.current
    soundRef.current = next

    // Synchronously mute/unmute ALL videos within the user gesture.
    // This is critical for Chrome — unmuting must happen synchronously inside
    // the click handler, not in an async useEffect after React re-renders.
    applyMutedStates()

    // Call play() on the focused video when unmuting (Chrome requires this
    // within a user gesture in case the video was paused by autoplay policy)
    if (next) {
      const focusedId = focusedRef.current
      if (focusedId) {
        const el = videosRef.current.get(focusedId)
        if (el) el.play().catch(() => {})
      }
    }

    setSoundEnabled(next)
  }, [applyMutedStates])

  const releaseFocus = useCallback(() => {
    soundRef.current = false
    applyMutedStates()
    setSoundEnabled(false)
  }, [applyMutedStates])

  return { soundEnabled, focusedVideoId, toggleSound, releaseFocus, register, unregister }
}

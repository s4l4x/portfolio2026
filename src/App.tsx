import { useEffect, useRef, useState, useCallback } from 'react'
import './App.css'
import { projects } from './data/projects'
import { getManifestEntry } from './data/media-manifest'
import { useVideoAudioManager } from './hooks/useVideoAudioManager'
import type { AudioManager } from './hooks/useVideoAudioManager'
import { useVideoLoadQueue } from './hooks/useVideoLoadQueue'
import type { VideoLoadQueue } from './hooks/useVideoLoadQueue'
import type { MediaItem, Project } from './types/project'
import { ShaderCanvas } from './components/ShaderCanvas'

function formatDateRange(startDate?: string, endDate?: string) {
  if (!startDate) return null
  const fmt = (d: string) => {
    const [year, month] = d.split('-')
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${monthNames[parseInt(month) - 1]} ${year}`
  }
  const start = fmt(startDate)
  const end = endDate ? fmt(endDate) : 'Present'
  return `${start} \u2013 ${end}`
}

function SpeakerIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.636 7.028a1.5 1.5 0 1 0-2.395 1.807 5.365 5.365 0 0 1 1.103 3.17 5.378 5.378 0 0 1-1.105 3.176 1.5 1.5 0 1 0 2.395 1.806 8.396 8.396 0 0 0 1.71-4.981 8.39 8.39 0 0 0-1.708-4.978Zm3.73-2.332A1.5 1.5 0 1 0 18.04 6.59 8.823 8.823 0 0 1 20 12.007a8.798 8.798 0 0 1-1.96 5.415 1.5 1.5 0 0 0 2.326 1.894 11.672 11.672 0 0 0 2.635-7.31 11.682 11.682 0 0 0-2.635-7.31Zm-8.963-3.613a1.001 1.001 0 0 0-1.082.187L5.265 6H2a1 1 0 0 0-1 1v10.003a1 1 0 0 0 1 1h3.265l5.01 4.682.02.021a1 1 0 0 0 1.704-.814L12.005 2a1 1 0 0 0-.602-.917Z" />
    </svg>
  )
}

function SpeakerMutedIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 48 48" fill="currentColor">
      <path clipRule="evenodd" fillRule="evenodd" d="M1.5 13.3c-.8 0-1.5.7-1.5 1.5v18.4c0 .8.7 1.5 1.5 1.5h8.7l12.9 12.9c.9.9 2.5.3 2.5-1v-9.8c0-.4-.2-.8-.4-1.1l-22-22c-.3-.3-.7-.4-1.1-.4h-.6zm46.8 31.4-5.5-5.5C44.9 36.6 48 31.4 48 24c0-11.4-7.2-17.4-7.2-17.4-.6-.6-1.6-.6-2.2 0L37.2 8c-.6.6-.6 1.6 0 2.2 0 0 5.7 5 5.7 13.8 0 5.4-2.1 9.3-3.8 11.6L35.5 32c1.1-1.7 2.3-4.4 2.3-8 0-6.8-4.1-10.3-4.1-10.3-.6-.6-1.6-.6-2.2 0l-1.4 1.4c-.6.6-.6 1.6 0 2.2 0 0 2.6 2 2.6 6.7 0 1.8-.4 3.2-.9 4.3L25.5 22V1.4c0-1.3-1.6-1.9-2.5-1L13.5 10 3.3-.3c-.6-.6-1.5-.6-2.1 0L-.2 1.1c-.6.6-.6 1.5 0 2.1L4 7.6l26.8 26.8 13.9 13.9c.6.6 1.5.6 2.1 0l1.4-1.4c.7-.6.7-1.6.1-2.2z" />
    </svg>
  )
}

function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/.test(ua)) return true
  // iPad requesting desktop site reports as MacIntel but has touch
  if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return true
  return false
}

interface SourceRect {
  top: number
  left: number
  width: number
  height: number
}

interface ExpandedMedia {
  item: MediaItem
  isVideo: boolean
  sourceRect: SourceRect
  sourceElement: HTMLElement
  snapshotSrc?: string
  videoTime?: number
}

function computeTargetRect(aspectRatio: number): { top: number; left: number; width: number; height: number } {
  const isMobile = window.innerWidth <= 768
  const pad = isMobile ? 16 : 40
  const maxW = window.innerWidth - pad * 2
  const maxH = window.innerHeight - pad * 2

  let w: number, h: number
  if (maxW / maxH > aspectRatio) {
    h = maxH
    w = h * aspectRatio
  } else {
    w = maxW
    h = w / aspectRatio
  }

  return {
    top: (window.innerHeight - h) / 2,
    left: (window.innerWidth - w) / 2,
    width: w,
    height: h,
  }
}

type LightboxPhase = 'entering' | 'open' | 'exiting'

function MediaLightbox({ media, onExitComplete }: { media: ExpandedMedia; onExitComplete: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const [phase, setPhase] = useState<LightboxPhase>('entering')
  const [backdropVisible, setBackdropVisible] = useState(false)
  const closingRef = useRef(false)

  const { item, sourceRect, sourceElement } = media
  const manifest = getManifestEntry(item.src)

  // Compute aspect ratio — fall back to source element dimensions
  const aspectRatio = manifest?.width && manifest?.height
    ? manifest.width / manifest.height
    : sourceRect.width / sourceRect.height

  const targetRect = computeTargetRect(aspectRatio)

  // Compute inverse transform: from target position, translate+scale so it visually sits at source
  const scaleX = sourceRect.width / targetRect.width
  const scaleY = sourceRect.height / targetRect.height
  const translateX = sourceRect.left - targetRect.left + (sourceRect.width - targetRect.width) / 2
  const translateY = sourceRect.top - targetRect.top + (sourceRect.height - targetRect.height) / 2

  const inverseTransform = `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`

  // Lock body scroll, clean up AudioContext
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
      audioCtxRef.current?.close()
    }
  }, [])

  // Enter animation: double-rAF to trigger CSS transition
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.style.transform = inverseTransform
    let raf1: number, raf2: number
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setBackdropVisible(true)
        container.classList.add('lightbox-clone--animate')
        container.style.transform = 'none'
      })
    })
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Transition to "open" after enter animation completes
  useEffect(() => {
    const container = containerRef.current
    if (!container || phase !== 'entering') return
    const onEnd = (e: TransitionEvent) => {
      if (e.target !== container || e.propertyName !== 'transform') return
      setPhase('open')
    }
    container.addEventListener('transitionend', onEnd)
    return () => container.removeEventListener('transitionend', onEnd)
  }, [phase])

  // Immediately seek and play muted so the video is live during fly-in
  useEffect(() => {
    if (!media.isVideo) return
    const el = videoRef.current
    if (!el) return

    const playMuted = () => {
      el.muted = true
      el.play().catch(() => {})
    }

    if (media.videoTime !== undefined && media.videoTime > 0) {
      el.currentTime = media.videoTime
      el.addEventListener('seeked', playMuted, { once: true })
      return () => el.removeEventListener('seeked', playMuted)
    } else if (el.readyState >= 2) {
      playMuted()
    } else {
      el.addEventListener('loadeddata', playMuted, { once: true })
      return () => el.removeEventListener('loadeddata', playMuted)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // When animation lands: route through Web Audio and unmute
  useEffect(() => {
    if (phase !== 'open' || !media.isVideo) return
    const el = videoRef.current
    if (!el) return

    // Route audio through Web Audio API for sample-accurate fade on close
    try {
      const ctx = new AudioContext()
      const source = ctx.createMediaElementSource(el)
      const gain = ctx.createGain()
      source.connect(gain)
      gain.connect(ctx.destination)
      audioCtxRef.current = ctx
      gainRef.current = gain
    } catch {
      // Fallback: direct audio (may click on close)
    }

    el.muted = false
    const p = el.play()
    if (p) p.catch(() => { el.muted = true; el.play().catch(() => {}) })
  }, [phase, media.isVideo])

  // Exit animation
  useEffect(() => {
    if (phase !== 'exiting') return
    const container = containerRef.current
    if (!container) return

    // Re-query source element position (may have scrolled)
    const currentSourceRect = sourceElement.getBoundingClientRect()
    const isVisible = currentSourceRect.top < window.innerHeight && currentSourceRect.bottom > 0
      && currentSourceRect.left < window.innerWidth && currentSourceRect.right > 0

    if (isVisible) {
      const exitScaleX = currentSourceRect.width / targetRect.width
      const exitScaleY = currentSourceRect.height / targetRect.height
      const exitTranslateX = currentSourceRect.left - targetRect.left + (currentSourceRect.width - targetRect.width) / 2
      const exitTranslateY = currentSourceRect.top - targetRect.top + (currentSourceRect.height - targetRect.height) / 2
      const exitTransform = `translate(${exitTranslateX}px, ${exitTranslateY}px) scale(${exitScaleX}, ${exitScaleY})`

      container.classList.remove('lightbox-clone--animate')
      void container.offsetHeight
      container.classList.add('lightbox-clone--exit')
      container.style.transform = exitTransform
    } else {
      container.classList.remove('lightbox-clone--animate', 'lightbox-clone--exit')
      container.classList.add('lightbox-clone--fade-exit')
    }

    const onEnd = () => onExitComplete()
    container.addEventListener('transitionend', onEnd, { once: true })
    return () => container.removeEventListener('transitionend', onEnd)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const handleClose = useCallback(() => {
    if (closingRef.current) return
    closingRef.current = true

    if (media.isVideo && videoRef.current) {
      const vid = videoRef.current

      // Sample-accurate fade via Web Audio gain ramp (no clicks)
      const ctx = audioCtxRef.current
      const gain = gainRef.current
      if (ctx && gain) {
        gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime)
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3)
      } else {
        vid.muted = true
      }

      // Sync grid video to lightbox position
      const gridVideo = sourceElement.querySelector('video')
      if (gridVideo) {
        gridVideo.currentTime = vid.currentTime
      }
    }

    setPhase('exiting')
  }, [media.isVideo, sourceElement])

  // Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleClose])

  const snapshotSrc = media.snapshotSrc || item.posterSrc || item.src
  const backdropClass = `lightbox-backdrop${phase === 'exiting' ? ' lightbox-backdrop--exit' : backdropVisible ? ' lightbox-backdrop--visible' : ''}`

  const containerStyle: React.CSSProperties = {
    top: targetRect.top,
    left: targetRect.left,
    width: targetRect.width,
    height: targetRect.height,
    zIndex: 1001,
    borderRadius: 8,
  }

  // Render real content directly in the animated container
  const renderContent = () => {
    if (media.isVideo) {
      return (
        <video
          ref={videoRef}
          src={item.src}
          poster={snapshotSrc}
          loop
          playsInline
          onClick={(e) => e.stopPropagation()}
        />
      )
    }

    if (item.foregroundSrc) {
      return (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}
        >
          {item.shader ? (
            <ShaderCanvas imageSrc={item.src} className="media-bg" />
          ) : (
            <img src={item.src} alt={item.alt} className="media-bg" />
          )}
          <img src={item.foregroundSrc} alt="" className="media-fg" />
        </div>
      )
    }

    return <img src={snapshotSrc} alt={item.alt || ''} onClick={(e) => e.stopPropagation()} />
  }

  return (
    <>
      <div className={backdropClass} onClick={handleClose} />
      <div ref={containerRef} className="lightbox-clone" style={containerStyle} onClick={handleClose}>
        {renderContent()}
      </div>
    </>
  )
}

function MediaDisplay({ item, audioManager, videoLoadQueue, onMediaTap }: { item: MediaItem; audioManager: AudioManager; videoLoadQueue: VideoLoadQueue; onMediaTap?: (item: MediaItem, videoEl: HTMLVideoElement | null, sourceElement: HTMLElement) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const idRef = useRef<string>('')
  const [videoProgress, setVideoProgress] = useState(0)
  const [videoPlaying, setVideoPlaying] = useState(false)

  const manifest = getManifestEntry(item.src)
  const hasAudio = manifest?.type === 'video' && manifest.hasAudio === true
  const aspectRatio = manifest?.width && manifest?.height ? manifest.width / manifest.height : undefined

  // Register with audio manager (only for videos with audio)
  const { register: audioRegister, unregister: audioUnregister } = audioManager
  useEffect(() => {
    if (!hasAudio || !videoRef.current) return
    const id = item.src
    idRef.current = id
    audioRegister(id, videoRef.current)
    return () => {
      audioUnregister(id)
    }
  }, [hasAudio, item.src, audioRegister, audioUnregister])

  // Register with load queue (all videos)
  const { register: queueRegister, unregister: queueUnregister } = videoLoadQueue
  useEffect(() => {
    if (item.type !== 'video') return
    const el = videoRef.current
    if (!el) return
    const id = item.src
    queueRegister(id, el, item.src)
    return () => {
      queueUnregister(id)
    }
  }, [item.type, item.src, queueRegister, queueUnregister])

  // Track buffering progress and playing state
  useEffect(() => {
    if (item.type !== 'video') return
    const el = videoRef.current
    if (!el) return

    const updateProgress = () => {
      if (el.duration && el.buffered.length > 0) {
        const end = el.buffered.end(el.buffered.length - 1)
        setVideoProgress(end / el.duration)
      }
    }

    const onPlaying = () => setVideoPlaying(true)

    el.addEventListener('progress', updateProgress)
    el.addEventListener('playing', onPlaying)

    return () => {
      el.removeEventListener('progress', updateProgress)
      el.removeEventListener('playing', onPlaying)
    }
  }, [item.type])

  const handleTap = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (onMediaTap) onMediaTap(item, videoRef.current, e.currentTarget)
  }, [onMediaTap, item])

  if (item.type === 'video') {
    const isUnmuted = hasAudio && audioManager.soundEnabled && audioManager.focusedVideoId === item.src

    return (
      <div className="video-wrapper" onClick={handleTap} style={{ cursor: onMediaTap ? 'pointer' : undefined }}>
        <video
          ref={videoRef}
          className="media-item"
          poster={item.posterSrc}
          muted
          loop
          playsInline
          style={aspectRatio ? { aspectRatio } : undefined}
        />
        {!videoPlaying && (
          <div className="video-progress">
            <div className="video-progress-bar" style={{ width: `${videoProgress * 100}%` }} />
          </div>
        )}
        {hasAudio && (
          <button
            className={`video-sound-btn${isUnmuted ? ' video-sound-btn--unmuted' : ''}`}
            onClick={(e) => { e.stopPropagation(); audioManager.toggleSound() }}
            aria-label={isUnmuted ? 'Mute' : 'Unmute'}
          >
            {isUnmuted ? <SpeakerIcon /> : <SpeakerMutedIcon />}
          </button>
        )}
      </div>
    )
  }

  if (item.foregroundSrc) {
    return (
      <div
        className="media-item media-layered"
        onClick={handleTap}
        style={{ ...(aspectRatio ? { aspectRatio } : {}), cursor: onMediaTap ? 'pointer' : undefined }}
      >
        {item.shader ? (
          <ShaderCanvas imageSrc={item.src} className="media-bg" />
        ) : (
          <img src={item.src} alt={item.alt} className="media-bg" />
        )}
        <img src={item.foregroundSrc} alt="" className="media-fg" />
      </div>
    )
  }

  return (
    <img
      className="media-item"
      src={item.src}
      alt={item.alt}
      loading="lazy"
      onClick={handleTap}
      style={{ ...(aspectRatio ? { aspectRatio } : {}), cursor: onMediaTap ? 'pointer' : undefined }}
    />
  )
}

function ProjectSection({ project, nested, audioManager, videoLoadQueue, onMediaTap }: { project: Project; nested?: boolean; audioManager: AudioManager; videoLoadQueue: VideoLoadQueue; onMediaTap?: (item: MediaItem, videoEl: HTMLVideoElement | null, sourceElement: HTMLElement) => void }) {
  const dateRange = formatDateRange(project.startDate, project.endDate)
  const showDate = project.showDate !== false
  const hasContent = project.description || project.media.length > 0

  return (
    <section className={`project ${nested ? 'project--nested' : ''}`}>
      {hasContent && (
        <>
          <div className="project-info">
            <div className="project-meta">
              <h2 className={`project-title ${nested ? 'project-title--nested' : ''}`}>
                {project.title}
              </h2>
              {project.company && project.company !== project.title && (
                <p className="project-role">{project.company}</p>
              )}
              {project.role && <p className="project-role">{project.role}</p>}
              {showDate && dateRange && <p className="project-date">{dateRange}</p>}
            </div>
            {project.description && (
              <p className="project-description">{project.description}</p>
            )}
          </div>

          {project.media.length > 0 && (
            <div className="project-media">
              <div className="media-gutter" aria-hidden="true" />
              {project.media.map((item, i) => (
                <MediaDisplay key={i} item={item} audioManager={audioManager} videoLoadQueue={videoLoadQueue} onMediaTap={onMediaTap} />
              ))}
            </div>
          )}
        </>
      )}

      {project.subProjects?.map((sub, i) => (
        <ProjectSection key={i} project={sub} nested audioManager={audioManager} videoLoadQueue={videoLoadQueue} onMediaTap={onMediaTap} />
      ))}
    </section>
  )
}

function App() {
  const audioManager = useVideoAudioManager()
  const videoLoadQueue = useVideoLoadQueue()
  const [expandedMedia, setExpandedMedia] = useState<ExpandedMedia | null>(null)

  const handleMediaTap = useCallback((item: MediaItem, videoEl: HTMLVideoElement | null, sourceElement: HTMLElement) => {
    // Guard against opening while exiting
    if (expandedMedia) return

    const isVideo = item.type === 'video'

    // Force-load this video if it hasn't loaded yet
    if (isVideo) videoLoadQueue.prioritize(item.src)

    if (isVideo && isIOSDevice() && videoEl) {
      // Native iOS fullscreen with landscape support
      const el = videoEl as HTMLVideoElement & { webkitEnterFullscreen?: () => void }
      if (el.webkitEnterFullscreen) {
        el.muted = false
        el.webkitEnterFullscreen()
        const onEnd = () => {
          el.muted = true
          el.removeEventListener('webkitendfullscreen', onEnd)
          // iOS fires a deferred pause after exiting fullscreen (especially
          // via the (x) button). Listen for it and resume from there instead
          // of racing with a timeout.
          const onPause = () => {
            el.removeEventListener('pause', onPause)
            el.play().catch(() => {})
          }
          el.addEventListener('pause', onPause)
          // Also try immediately in case the pause already happened (swipe dismiss)
          el.play().catch(() => {})
        }
        el.addEventListener('webkitendfullscreen', onEnd)
        return
      }
    }

    // Capture source position for FLIP animation
    const rect = sourceElement.getBoundingClientRect()
    const sourceRect: SourceRect = { top: rect.top, left: rect.left, width: rect.width, height: rect.height }

    // Apply ghost class to source element
    const ghostClass = isVideo ? 'video-wrapper--ghost' : 'media-item--ghost'
    sourceElement.classList.add(ghostClass)

    // Capture current video frame and timestamp for seamless transition
    let snapshotSrc: string | undefined
    let videoTime: number | undefined
    if (isVideo && videoEl) {
      videoTime = videoEl.currentTime
      try {
        const canvas = document.createElement('canvas')
        canvas.width = videoEl.videoWidth || videoEl.clientWidth
        canvas.height = videoEl.videoHeight || videoEl.clientHeight
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height)
          snapshotSrc = canvas.toDataURL('image/jpeg', 0.85)
        }
      } catch {
        // CORS or other error — fall back to poster
      }
    }

    // Desktop (or image on any device): open lightbox
    if (isVideo) audioManager.releaseFocus()
    setExpandedMedia({ item, isVideo, sourceRect, sourceElement, snapshotSrc, videoTime })
  }, [audioManager, videoLoadQueue, expandedMedia])

  const handleExitComplete = useCallback(() => {
    if (!expandedMedia) return
    const { sourceElement, isVideo } = expandedMedia
    const ghostClass = isVideo ? 'video-wrapper--ghost' : 'media-item--ghost'
    sourceElement.classList.remove(ghostClass)
    // Resume grid video playback (was paused on close for frame alignment)
    if (isVideo) {
      const gridVideo = sourceElement.querySelector('video')
      if (gridVideo) gridVideo.play().catch(() => {})
    }
    setExpandedMedia(null)
  }, [expandedMedia])

  return (
    <div className="portfolio">
      <header className="header">
        <div className="header-top">
          <span className="header-site">portfolio.com</span>
        </div>
        <div className="header-intro">
          <div>
            <h1 className="header-name">Alessandro Sabatelli</h1>
            <p className="header-bio">
              Designer building at the intersection of technology and human
              experience
            </p>
          </div>
        </div>
      </header>

      <main>
        {projects.map((project, i) => (
          <ProjectSection
            key={i}
            project={project}
            audioManager={audioManager}
            videoLoadQueue={videoLoadQueue}
            onMediaTap={handleMediaTap}
          />
        ))}
      </main>

      {expandedMedia && (
        <MediaLightbox media={expandedMedia} onExitComplete={handleExitComplete} />
      )}
    </div>
  );
}

export default App

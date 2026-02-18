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

interface ExpandedMedia {
  item: MediaItem
  isVideo: boolean
}

function MediaLightbox({ media, onClose }: { media: ExpandedMedia; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    el.muted = false
    const p = el.play()
    if (p) p.catch(() => { el.muted = true; el.play().catch(() => {}) })
  }, [])

  const { item } = media
  const manifest = getManifestEntry(item.src)
  const aspectRatio = manifest?.width && manifest?.height ? manifest.width / manifest.height : undefined
  const styleWithRatio = aspectRatio ? { aspectRatio } : undefined

  return (
    <div className="lightbox-backdrop" onClick={onClose}>
      {media.isVideo ? (
        <video
          ref={videoRef}
          className="lightbox-media"
          src={item.src}
          poster={item.posterSrc}
          loop
          playsInline
          autoPlay
          onClick={(e) => e.stopPropagation()}
          style={styleWithRatio}
        />
      ) : item.foregroundSrc ? (
        <div className="lightbox-media lightbox-layered" onClick={(e) => e.stopPropagation()} style={styleWithRatio}>
          {item.shader ? (
            <ShaderCanvas imageSrc={item.src} className="media-bg" />
          ) : (
            <img src={item.src} alt={item.alt} className="media-bg" />
          )}
          <img src={item.foregroundSrc} alt="" className="media-fg" />
        </div>
      ) : (
        <img
          className="lightbox-media"
          src={item.src}
          alt={item.alt}
          onClick={(e) => e.stopPropagation()}
          style={styleWithRatio}
        />
      )}
    </div>
  )
}

function MediaDisplay({ item, audioManager, videoLoadQueue, onMediaTap }: { item: MediaItem; audioManager: AudioManager; videoLoadQueue: VideoLoadQueue; onMediaTap?: (item: MediaItem, videoEl: HTMLVideoElement | null) => void }) {
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

  const handleTap = useCallback(() => {
    if (onMediaTap) onMediaTap(item, videoRef.current)
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

function ProjectSection({ project, nested, audioManager, videoLoadQueue, onMediaTap }: { project: Project; nested?: boolean; audioManager: AudioManager; videoLoadQueue: VideoLoadQueue; onMediaTap?: (item: MediaItem, videoEl: HTMLVideoElement | null) => void }) {
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

  const handleMediaTap = useCallback((item: MediaItem, videoEl: HTMLVideoElement | null) => {
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
          // iOS pauses the video after this event fires; delay resume
          setTimeout(() => { el.play().catch(() => {}) }, 300)
        }
        el.addEventListener('webkitendfullscreen', onEnd)
        return
      }
    }

    // Desktop (or image on any device): open lightbox
    if (isVideo) audioManager.releaseFocus()
    setExpandedMedia({ item, isVideo })
  }, [audioManager, videoLoadQueue])

  const closeExpandedMedia = useCallback(() => {
    setExpandedMedia(null)
  }, [])

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
        <MediaLightbox media={expandedMedia} onClose={closeExpandedMedia} />
      )}
    </div>
  );
}

export default App

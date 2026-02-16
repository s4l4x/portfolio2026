import { useEffect, useRef } from 'react'
import './App.css'
import { projects } from './data/projects'
import { getManifestEntry } from './data/media-manifest'
import { useVideoAudioManager } from './hooks/useVideoAudioManager'
import type { AudioManager } from './hooks/useVideoAudioManager'
import type { MediaItem, Project } from './types/project'

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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  )
}

function SpeakerMutedIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  )
}

function MediaDisplay({ item, audioManager }: { item: MediaItem; audioManager: AudioManager }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const idRef = useRef<string>('')

  const manifest = item.type === 'video' ? getManifestEntry(item.src) : undefined
  const hasAudio = manifest?.type === 'video' && manifest.hasAudio === true

  useEffect(() => {
    if (!hasAudio || !videoRef.current) return
    const id = item.src
    idRef.current = id
    audioManager.register(id, videoRef.current)
    return () => {
      audioManager.unregister(id)
    }
  }, [hasAudio, item.src, audioManager])

  // Imperatively control muted (React's muted JSX attribute is unreliable)
  useEffect(() => {
    if (!videoRef.current || !hasAudio) return
    videoRef.current.muted = !(audioManager.soundEnabled && audioManager.focusedVideoId === item.src)
  }, [audioManager.soundEnabled, audioManager.focusedVideoId, hasAudio, item.src])

  if (item.type === 'video') {
    const isUnmuted = hasAudio && audioManager.soundEnabled && audioManager.focusedVideoId === item.src

    if (hasAudio) {
      return (
        <div className="video-wrapper">
          <video
            ref={videoRef}
            className="media-item"
            src={item.src}
            poster={item.posterSrc}
            muted
            loop
            playsInline
            autoPlay
            style={item.aspectRatio ? { aspectRatio: item.aspectRatio } : undefined}
          />
          <button
            className={`video-sound-btn${isUnmuted ? ' video-sound-btn--unmuted' : ''}`}
            onClick={audioManager.toggleSound}
            aria-label={isUnmuted ? 'Mute' : 'Unmute'}
          >
            {isUnmuted ? <SpeakerIcon /> : <SpeakerMutedIcon />}
          </button>
        </div>
      )
    }

    return (
      <video
        className="media-item"
        src={item.src}
        poster={item.posterSrc}
        muted
        loop
        playsInline
        autoPlay
        style={item.aspectRatio ? { aspectRatio: item.aspectRatio } : undefined}
      />
    )
  }

  if (item.foregroundSrc) {
    return (
      <div
        className="media-item media-layered"
        style={item.aspectRatio ? { aspectRatio: item.aspectRatio } : undefined}
      >
        <img src={item.src} alt={item.alt} className="media-bg" />
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
      style={item.aspectRatio ? { aspectRatio: item.aspectRatio } : undefined}
    />
  )
}

function ProjectSection({ project, nested, audioManager }: { project: Project; nested?: boolean; audioManager: AudioManager }) {
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
                <MediaDisplay key={i} item={item} audioManager={audioManager} />
              ))}
            </div>
          )}
        </>
      )}

      {project.subProjects?.map((sub, i) => (
        <ProjectSection key={i} project={sub} nested audioManager={audioManager} />
      ))}
    </section>
  )
}

function App() {
  const audioManager = useVideoAudioManager()

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
              Designer-Engineer building at the intersection of technology
              and human experience
            </p>
          </div>
        </div>
      </header>

      <main>
        {projects.map((project, i) => (
          <ProjectSection key={i} project={project} audioManager={audioManager} />
        ))}
      </main>
    </div>
  )
}

export default App

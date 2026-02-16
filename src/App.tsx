import './App.css'
import { projects } from './data/projects'
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

function MediaDisplay({ item }: { item: MediaItem }) {
  if (item.type === 'video') {
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

function ProjectSection({ project, nested }: { project: Project; nested?: boolean }) {
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
                <MediaDisplay key={i} item={item} />
              ))}
            </div>
          )}
        </>
      )}

      {project.subProjects?.map((sub, i) => (
        <ProjectSection key={i} project={sub} nested />
      ))}
    </section>
  )
}

function App() {
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
          <ProjectSection key={i} project={project} />
        ))}
      </main>
    </div>
  )
}

export default App

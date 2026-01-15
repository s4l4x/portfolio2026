import { Project } from '../types/project';

interface ProjectCardProps {
  project: Project;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function formatDate(dateString: string): string {
  const [year, month] = dateString.split('-');
  return `${MONTHS[parseInt(month, 10) - 1]} ${year}`;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const startFormatted = formatDate(project.startDate);
  const endFormatted = project.endDate ? formatDate(project.endDate) : null;
  const dateDisplay = endFormatted 
    ? `${startFormatted} – ${endFormatted}` 
    : startFormatted;

  return (
    <article className="project-card">
      <div className="project-image">
        <img src={project.image} alt={project.title} loading="lazy" />
      </div>
      <div className="project-content">
        <time className="project-date">{dateDisplay}</time>
        <h2 className="project-title">{project.title}</h2>
        <p className="project-description">{project.description}</p>
      </div>
    </article>
  );
}

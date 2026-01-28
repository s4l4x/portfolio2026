import { useState, useRef, useEffect, useCallback } from 'react';
import { Project } from '../types/project';
import { TiledImage } from "./TiledImage";
import { ShaderImage } from "./ShaderImage";

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

  const [hover, setHover] = useState(false);
  const foregroundRef = useRef<HTMLImageElement>(null);
  const animationRef = useRef<number | null>(null);
  const currentFgScale = useRef(1);
  const currentFgY = useRef(0);

  const animate = useCallback(() => {
    const lerp = 0.12;
    const fgTargetScale = hover ? 1.06 : 1;
    const fgTargetY = hover ? -3 : 0;

    currentFgScale.current += (fgTargetScale - currentFgScale.current) * lerp;
    currentFgY.current += (fgTargetY - currentFgY.current) * lerp;

    if (foregroundRef.current) {
      foregroundRef.current.style.transform = `scale(${currentFgScale.current}) translateY(${currentFgY.current}%)`;
    }

    const diff = Math.abs(fgTargetScale - currentFgScale.current);
    if (diff > 0.001) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      animationRef.current = null;
    }
  }, [hover]);

  useEffect(() => {
    if (foregroundRef.current && !animationRef.current) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [hover, animate]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <article className="project-card">
      <div
        className="project-image"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {project.shader ? (
          <ShaderImage
            src={project.image}
            shaderType={project.shader}
            alt={project.title}
            className="project-image-background"
            hover={hover}
          />
        ) : (
          <TiledImage
            src={project.image}
            alt={project.title}
            className="project-image-background"
            hover={hover}
          />
        )}
        {project.foregroundImage && (
          <img
            ref={foregroundRef}
            src={project.foregroundImage}
            alt=""
            loading="lazy"
            className="project-image-foreground"
          />
        )}
      </div>
      <div className="project-content">
        <time className="project-date">{dateDisplay}</time>
        <h2 className="project-title">{project.title}</h2>
        <p className="project-description">{project.description}</p>
      </div>
    </article>
  );
}

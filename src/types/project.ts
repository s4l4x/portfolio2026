export interface MediaItem {
  src: string;
  type?: "video";
  alt: string;
  posterSrc?: string;
  lqipSrc?: string;
  foregroundSrc?: string;
  shader?: string;
  title?: string;
  description?: string;
  role?: string;
  startDate?: string;
  endDate?: string;
}

export interface Project {
  title: string;
  company?: string;
  role?: string;
  description: string;
  startDate?: string;
  endDate?: string;
  showDate?: boolean;
  media: MediaItem[];
  subProjects?: Project[];
}

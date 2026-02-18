export interface MediaItem {
  src: string;
  type?: 'video';
  alt: string;
  posterSrc?: string;
  lqipSrc?: string;
  foregroundSrc?: string;
  shader?: string;
  cssEffect?: string;
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

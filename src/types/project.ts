import type { MediaItem } from "./media";

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

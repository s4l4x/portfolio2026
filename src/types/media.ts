export interface ScreenInset {
  top: string;
  left: string;
  right: string;
  bottom: string;
}

export interface MediaItem {
  src: string;
  type?: "video";
  alt: string;
  posterSrc?: string;

  foregroundSrc?: string;
  frameSrc?: string;
  screenInset?: ScreenInset;
  shader?: string;
  title?: string;
  description?: string;
  role?: string;
  startDate?: string;
  endDate?: string;
}

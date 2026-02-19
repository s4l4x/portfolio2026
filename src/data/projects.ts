import type { Project } from "../types/project";

// Main images
import gLoveImage from "../assets/g-love/g.love.png";
import braidSlidesAugment from "../assets/braid/Braid-Slides-Augment.png";
import braidSlidesCollaboration from "../assets/braid/Braid-Slides-Collaboration.png";
import braidSlidesGenerate from "../assets/braid/Braid-Slides-Generate.png";
import braidSlidesKota from "../assets/braid/Braid-Slides-Kota.png";
import braidSlidesSecurity from "../assets/braid/Braid-Slides-Security.png";
import braidSlidesSharing from "../assets/braid/Braid-Slides-Sharing.png";
import braidSlidesTapping from "../assets/braid/Braid-Slides-Tapping.png";
import braidSlidesWonder from "../assets/braid/Braid-Slides-Wonder.png";
import apolloImage from "../assets/apollo/apolloVibes.png";
import dionysianBG from "../assets/dionysian/dionysianJournals.png";
import dionysianFG from "../assets/dionysian/dionysianJournalsFG.png";
import ixomoxiImage from "../assets/ixomoxi/ixomoxiMissy.png";
import lucyFiferImage from "../assets/lucy/lucyFifer.png";
import lucyLogoImage from "../assets/lucy/lucyLogo.png";
import watchFaceSolar45 from "../assets/apple-hi/watch-solar-off-axis.jpg";
import watchFaceChrono45 from "../assets/apple-hi/watch-chrono-off-axis.jpg";
import siriIOS5MicFramed from "../assets/apple-hi/siri-iOS5-mic-framed.png";
import siriIOS5SnippetFramed from "../assets/apple-hi/siri-iOS5-snippet-framed.png";

// Videos
import gLoveVideoWhiteGlove from "../assets/g-love/g.love-IMG_7225-1080p.mov";
import gLoveVideo from "../assets/g-love/g.love-IMG_7636-1080p.mov";
import ixomoxiEscVideo from "../assets/ixomoxi/ixomoxi_esc_audio-HD.mov";
import periscopeSizzleVideo from "../assets/twitter/periscopeLive360_sizzle.mp4";
import twitterBuildingVideo from "../assets/twitter/Twitter_Building_081517-HD-1080p.mov";
import twitterMarvelVideo from "../assets/twitter/Twitter_Marvel_02-HD-1080p.mov";
import twitterViewfinderVideo from "../assets/twitter/Twitter_Viewfinder-Up-to-4K.mov";

// Use Vite's import.meta.glob to optionally import generated assets
// These files are created by: npm run generate-lqip && npm run generate-posters
// If they don't exist, the glob returns an empty object and the assets are undefined

// LQIP placeholders (tiny ~20px WebP images for blur-up effect)
const lqipModules = import.meta.glob<{ default: string }>(
  '../assets/**/*.lqip.webp',
  { eager: true }
);

// Video posters (first frame JPGs)
const posterModules = import.meta.glob<{ default: string }>(
  '../assets/**/*.poster.jpg',
  { eager: true }
);

// Helper to get asset from glob result
function getAsset(modules: Record<string, { default: string }>, filename: string): string | undefined {
  const key = Object.keys(modules).find(k => k.includes(filename));
  return key ? modules[key].default : undefined;
}

// Get LQIP assets
const gLoveLqip = getAsset(lqipModules, 'g.love.lqip.webp');
const braidSlidesAugmentLqip = getAsset(
  lqipModules,
  "Braid-Slides-Augment.lqip.webp",
);
const braidSlidesCollaborationLqip = getAsset(
  lqipModules,
  "Braid-Slides-Collaboration.lqip.webp",
);
const braidSlidesGenerateLqip = getAsset(
  lqipModules,
  "Braid-Slides-Generate.lqip.webp",
);
const braidSlidesKotaLqip = getAsset(
  lqipModules,
  "Braid-Slides-Kota.lqip.webp",
);
const braidSlidesSecurityLqip = getAsset(
  lqipModules,
  "Braid-Slides-Security.lqip.webp",
);
const braidSlidesSharingLqip = getAsset(
  lqipModules,
  "Braid-Slides-Sharing.lqip.webp",
);
const braidSlidesTappingLqip = getAsset(
  lqipModules,
  "Braid-Slides-Tapping.lqip.webp",
);
const braidSlidesWonderLqip = getAsset(
  lqipModules,
  "Braid-Slides-Wonder.lqip.webp",
);
const apolloLqip = getAsset(lqipModules, 'apolloVibes.lqip.webp');
const dionysianBGLqip = getAsset(lqipModules, 'dionysianJournals.lqip.webp');
const ixomoxiLqip = getAsset(lqipModules, 'ixomoxiMissy.lqip.webp');
const lucyFiferLqip = getAsset(lqipModules, 'lucyFifer.lqip.webp');

// Get video poster assets
const gLoveVideoPoster = getAsset(posterModules, 'g.love-IMG_7636-1080p.poster.jpg');
const gLoveVideoWhiteGlovePoster = getAsset(posterModules, 'g.love-IMG_7225-1080p.poster.jpg');
const periscopeSizzlePoster = getAsset(posterModules, 'periscopeLive360_sizzle.poster.jpg');
const twitterBuildingPoster = getAsset(posterModules, 'Twitter_Building_081517-HD-1080p.poster.jpg');
const twitterMarvelPoster = getAsset(posterModules, 'Twitter_Marvel_02-HD-1080p.poster.jpg');
const twitterViewfinderPoster = getAsset(posterModules, 'Twitter_Viewfinder-Up-to-4K.poster.jpg');
const ixomoxiEscPoster = getAsset(posterModules, 'ixomoxi_esc_audio-HD.poster.jpg');

export const projects: Project[] = [
  {
    title: "g.love",
    company: "g.love",
    role: "Co-Founder, Design & Engineering",
    description:
      "A performance glove that translates an artist's physical intent into sound and light. It replaces hidden controls with visible, embodied expression allowing audiences to more deeply connect with artists.",
    startDate: "2025-05",
    media: [
      {
        src: gLoveVideo,
        type: "video",
        alt: "g.love performance glove",
        posterSrc: gLoveVideoPoster,
      },
      {
        src: gLoveVideoWhiteGlove,
        type: "video",
        alt: "g.love performance glove white glove",
        posterSrc: gLoveVideoWhiteGlovePoster,
      },
      {
        src: gLoveImage,
        alt: "g.love performance glove",
        lqipSrc: gLoveLqip,
      },
    ],
  },
  {
    title: "Braid Health",
    company: "Braid Health",
    role: "Co-Founder, Chief Product Officer",
    description:
      "Braid Health lets patients at any time and from anywhere access their medical records and get answers. AI provides immediate insights, while radiologists and cardiologists are always available to provide expert guidance.",
    startDate: "2018-02",
    endDate: "2025-05",
    media: [
      {
        src: braidSlidesGenerate,
        alt: "Braid Health AI interface",
        lqipSrc: braidSlidesGenerateLqip,
      },
      {
        src: braidSlidesAugment,
        alt: "Braid Health AI interface",
        lqipSrc: braidSlidesAugmentLqip,
      },
      {
        src: braidSlidesCollaboration,
        alt: "Braid Health AI interface",
        lqipSrc: braidSlidesCollaborationLqip,
      },
      {
        src: braidSlidesKota,
        alt: "Braid Health AI interface",
        lqipSrc: braidSlidesKotaLqip,
      },
      {
        src: braidSlidesSecurity,
        alt: "Braid Health AI interface",
        lqipSrc: braidSlidesSecurityLqip,
      },
      {
        src: braidSlidesSharing,
        alt: "Braid Health AI interface",
        lqipSrc: braidSlidesSharingLqip,
      },
      {
        src: braidSlidesTapping,
        alt: "Braid Health AI interface",
        lqipSrc: braidSlidesTappingLqip,
      },
      {
        src: braidSlidesWonder,
        alt: "Braid Health AI interface",
        lqipSrc: braidSlidesWonderLqip,
      },
    ],
  },
  {
    title: "Periscope Live 360",
    company: "Twitter",
    role: "Director of AR/VR",
    description:
      "Periscope Live 360 is a live broadcasting experience that lets you watch the world unfold in every direction, as it happens. By combining real-time video with freedom of perspective, it brings you closer to people and moments, making presence feel shared rather than observed.",
    startDate: "2016-12",
    media: [
      {
        src: periscopeSizzleVideo,
        type: "video",
        alt: "Periscope Live 360 broadcast",
        posterSrc: periscopeSizzlePoster,
      },
    ],
  },
  {
    title: "Twitter",
    role: "Director of AR/VR",
    description:
      "Viewfinder augments your view of the world with Twitter's live content. Open Twitter, swipe down, look around. Viwefinder recognizes hashtags and mentions and brings them to life. Viewfinder also augments broadcasts like the Oscars or the Olympics by knowing what's on. Hackweek 2017 winner.",
    startDate: "2017-10",
    media: [
      {
        title: "Viewfinder",
        src: twitterBuildingVideo,
        type: "video",
        alt: "Twitter Building video",
        posterSrc: twitterBuildingPoster,
      },
      {
        title: "Viewfinder",
        src: twitterMarvelVideo,
        type: "video",
        alt: "Twitter Marvel video",
        posterSrc: twitterMarvelPoster,
      },
      {
        title: "Viewfinder",
        description:
          "Viewfinder augments your view of the world with Twitter's live content. Open Twitter, swipe down, look around. Viwefinder recognizes hashtags and mentions and brings them to life. Viewfinder also augments broadcasts like the Oscars or the Olympics by knowing what's on. Live demo, hackweek 2017 winner!",
        src: twitterViewfinderVideo,
        type: "video",
        alt: "Twitter Viewfinder video",
        posterSrc: twitterViewfinderPoster,
      },
    ],
  },
  {
    title: "IXOMOXI",
    description: "Experiments at the edge of music, technology, and play.",
    startDate: "2024-11",
    company: "IXOMOXI",
    role: "Founder",
    media: [
      {
        title: "IXOMOXI ESC",
        description:
          "Music videos x1000. Immerse yourself in audio reactive music videos.",
        startDate: "2016-02",
        src: ixomoxiEscVideo,
        type: "video",
        alt: "IXOMOXI ESC audio visual",
        posterSrc: ixomoxiEscPoster,
      },
      {
        title: "Lucy",
        description: "See the world through Lucy's eyes.",
        startDate: "",
        src: lucyFiferImage,
        foregroundSrc: lucyLogoImage,
        shader: "colorCycle",
        alt: "Lucy",
        lqipSrc: lucyFiferLqip,
      },
      {
        src: ixomoxiImage,
        alt: "IXOMOXI visual",
        lqipSrc: ixomoxiLqip,
      },
    ],
  },
  {
    title: "Apple Human Interface",
    company: "Apple",
    role: "Designer",
    description: "",
    media: [
      {
        src: watchFaceSolar45,
        alt: "Apple Human Interface",
      },
      {
        src: watchFaceChrono45,
        alt: "Apple Human Interface",
      },
      {
        src: siriIOS5MicFramed,
        alt: "Siri iOS 5 microphone interface",
      },
      {
        src: siriIOS5SnippetFramed,
        alt: "Siri iOS 5 calendar snippet",
      },
    ],
  },
  {
    title: "Personal Projects",
    description: "",
    media: [
      {
        title: "The Dionysian Journals",
        role: "Album Artist",
        description:
          "An album exploring ecstasy, transformation, and the loss of fixed identity. Inspired by the cult of Dionysus, driven by sensation, emotion, and perception, it merges into a single, luminous state.",
        startDate: "2025-03",
        src: dionysianBG,
        foregroundSrc: dionysianFG,
        alt: "The Dionysian Journals album art",
        lqipSrc: dionysianBGLqip,
      },
      {
        title: "Apollo Neuro",
        role: "Design & Engineering",
        description:
          "Apollo is a hybrid hardware and mobile experience designed to help people feel calmer, more focused, and more present. The intro experience pairs tactile sensation with real-time Metal shaders that makes each moment feel immediate and grounded.",
        startDate: "2025-08",
        src: apolloImage,
        alt: "Apollo Neuroscience app",
        lqipSrc: apolloLqip,
      },
    ],
  },
];

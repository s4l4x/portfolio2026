import { Project } from "../types/project";
import gLoveImage from "../assets/g.love.png";
import braidHealthImage from "../assets/braidGenerate.png";
import apolloImage from "../assets/apolloVibes.png";
import periscopeImage from "../assets/periscopeLive360.webp";
import dionysianImage from "../assets/dionysianJournals.png";
import ixomoxiImage from "../assets/ixomoxiMissy.png";

export const projects: Project[] = [
  {
    title: "g.love",
    description:
      "A performance glove that translates an artist's physical intent into sound and light. It replaces hidden controls with visible, embodied expression allowing audiences to see the music being shaped in real time.",
    startDate: "2025-05",
    image: gLoveImage,
  },
  {
    title: "Braid Health",
    description:
      "Braid Health puts medical imaging expertise in patients' hands. AI-powered answers, radiologist access, and complete records are available to everyone, instantly.",
    startDate: "2018-02",
    endDate: "2025-05",
    image: braidHealthImage,
  },
  {
    title: "Apollo Neuroscience",
    description:
      "Apollo is a hybrid hardware and mobile experience designed to help people feel calmer, more focused, and more present. The intro experience pairs tactile sensation with real-time Metal shaders that makes each moment feel immediate and grounded.",
    startDate: "2025-08",
    image: apolloImage,
  },
  {
    title: "The Dionysian Journals",
    description:
      "The Dionysian Journals is an album that explores ecstasy, transformation, and the loss of fixed identity. Inspired by the cult of Dionysus, driven by sensation, emotion, and perception, it merges into a single, luminous state.",
    startDate: "2025-03",
    image: dionysianImage,
  },
  {
    title: "Periscope Live 360",
    description:
      "Periscope Live 360 is a live broadcasting experience that lets you watch the world unfold in every direction, as it happens. By combining real-time video with freedom of perspective, it brings you closer to people and moments, making presence feel shared rather than observed.",
    startDate: "2016-12",
    image: periscopeImage,
  },
  {
    title: "IXOMOXI",
    description: "Expirments at the edge of music, technology, and play.",
    startDate: "2024-11",
    image: ixomoxiImage,
  },
];

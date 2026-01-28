import { useMemo } from "react";
import { projects } from "./data/projects";
import { ProjectList } from "./components/ProjectList";
import { BackgroundShader } from "./components/BackgroundShader";
import "./App.css";

function App() {
  const imageUrls = useMemo(() => projects.map((p) => p.image), []);

  return (
    <>
      <BackgroundShader imageUrls={imageUrls} />
      <main className="portfolio">
        <header className="portfolio-header">
          <h1>Portfolio</h1>
          <p className="portfolio-subtitle">A collection of my recent work</p>
        </header>
        <ProjectList projects={projects} />
      </main>
    </>
  );
}

export default App;

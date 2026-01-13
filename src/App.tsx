import { projects } from './data/projects';
import { ProjectList } from './components/ProjectList';
import './App.css';

function App() {
  return (
    <main className="portfolio">
      <header className="portfolio-header">
        <h1>Portfolio</h1>
        <p className="portfolio-subtitle">A collection of my recent work</p>
      </header>
      <ProjectList projects={projects} />
    </main>
  );
}

export default App;

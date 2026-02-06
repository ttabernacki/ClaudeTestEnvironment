import { useState } from 'react';
import RankList from './components/RankList';
import './App.css';

function App() {
  const [programs, setPrograms] = useState([]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Residency Match Calculator</h1>
        <p>Build your rank list, then view match probabilities below.</p>
      </header>

      <main>
        <RankList programs={programs} setPrograms={setPrograms} />

        <section className="probabilities-section">
          <h2>Match Probabilities</h2>
          {programs.length === 0 ? (
            <p className="empty-message">
              Add programs to your rank list to see probabilities.
            </p>
          ) : (
            <p className="empty-message">Probability calculations coming soon.</p>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;

import { useState } from 'react';
import PersonColumn from './components/PersonColumn';
import ProbabilitySliders from './components/ProbabilitySliders';
import './App.css';

function App() {
  const [people, setPeople] = useState([]);
  const [newPersonName, setNewPersonName] = useState('');
  const [rankProbs, setRankProbs] = useState({
    rank1: 50,
    rank2: 25,
    rank3: 15,
    rank4plus: 10,
  });

  function addPerson(e) {
    e.preventDefault();
    const name = newPersonName.trim();
    if (!name) return;
    setPeople((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name, programs: [] },
    ]);
    setNewPersonName('');
  }

  function removePerson(personId) {
    setPeople((prev) => prev.filter((p) => p.id !== personId));
  }

  function updatePrograms(personId, updater) {
    setPeople((prev) =>
      prev.map((person) =>
        person.id === personId
          ? { ...person, programs: typeof updater === 'function' ? updater(person.programs) : updater }
          : person
      )
    );
  }

  // For a person, compute { location -> probability } based on rank and slider values
  function getLocationProbs(programs) {
    const probs = {};
    const rankValues = [rankProbs.rank1, rankProbs.rank2, rankProbs.rank3];
    const numFourPlus = Math.max(0, programs.length - 3);
    const fourPlusEach = numFourPlus > 0 ? rankProbs.rank4plus / numFourPlus : 0;

    programs.forEach((program, i) => {
      const loc = program.location.toLowerCase().trim();
      const p = i < 3 ? rankValues[i] / 100 : fourPlusEach / 100;
      probs[loc] = (probs[loc] || 0) + p;
    });
    return probs;
  }

  // P(all people end up at same location) = sum over locations of product of each person's prob
  function calcSameLocationProb() {
    const peopleWithPrograms = people.filter((p) => p.programs.length > 0);
    if (peopleWithPrograms.length < 2) return null;

    const allLocationProbs = peopleWithPrograms.map((p) => getLocationProbs(p.programs));

    // Collect all locations across all people
    const allLocations = new Set();
    allLocationProbs.forEach((probs) => {
      Object.keys(probs).forEach((loc) => allLocations.add(loc));
    });

    let totalProb = 0;
    for (const loc of allLocations) {
      let product = 1;
      for (const personProbs of allLocationProbs) {
        product *= personProbs[loc] || 0;
      }
      totalProb += product;
    }

    return totalProb;
  }

  const sameLocationProb = calcSameLocationProb();
  const hasProgramData = people.some((p) => p.programs.length > 0);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Residency Match Calculator</h1>
        <p>Add people and build each person's rank list.</p>
      </header>

      <ProbabilitySliders rankProbs={rankProbs} setRankProbs={setRankProbs} />

      <form className="add-person-form" onSubmit={addPerson}>
        <input
          type="text"
          value={newPersonName}
          onChange={(e) => setNewPersonName(e.target.value)}
          placeholder="Enter person's name…"
          aria-label="Person name"
        />
        <button type="submit">Add Person</button>
      </form>

      {people.length === 0 ? (
        <p className="empty-message">No people added yet. Add someone above to get started.</p>
      ) : (
        <div className="people-grid">
          {people.map((person) => (
            <PersonColumn
              key={person.id}
              person={person}
              onRemovePerson={removePerson}
              onUpdatePrograms={updatePrograms}
            />
          ))}
        </div>
      )}

      <section className="probabilities-section">
        <h2>Match Probabilities</h2>
        {!hasProgramData ? (
          <p className="empty-message">
            Add people and programs to see probabilities.
          </p>
        ) : sameLocationProb === null ? (
          <p className="empty-message">
            Add at least 2 people with programs to calculate probabilities.
          </p>
        ) : (
          <div className="prob-result">
            <div className="prob-card">
              <span className="prob-label">Chance everyone ends up in the same location</span>
              <span className="prob-value">{(sameLocationProb * 100).toFixed(1)}%</span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default App;

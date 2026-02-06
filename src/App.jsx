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

  // P(a group of people all end up at the same location)
  function calcGroupSameLocationProb(groupIndices, allLocationProbs, allLocations) {
    let totalProb = 0;
    for (const loc of allLocations) {
      let product = 1;
      for (const idx of groupIndices) {
        product *= allLocationProbs[idx][loc] || 0;
      }
      totalProb += product;
    }
    return totalProb;
  }

  // P(no two people share a location) — recursive enumeration of distinct assignments
  function calcNoOverlapProb(allLocationProbs, allLocations) {
    const N = allLocationProbs.length;
    const locations = [...allLocations];

    function recurse(personIdx, usedLocations) {
      if (personIdx === N) return 1;
      let prob = 0;
      for (const loc of locations) {
        if (usedLocations.has(loc)) continue;
        const pAtLoc = allLocationProbs[personIdx][loc] || 0;
        if (pAtLoc === 0) continue;
        usedLocations.add(loc);
        prob += pAtLoc * recurse(personIdx + 1, usedLocations);
        usedLocations.delete(loc);
      }
      return prob;
    }

    return recurse(0, new Set());
  }

  // Generate all combinations of size k from indices [0..n-1]
  function combinations(n, k) {
    const result = [];
    function helper(start, combo) {
      if (combo.length === k) {
        result.push([...combo]);
        return;
      }
      for (let i = start; i < n; i++) {
        combo.push(i);
        helper(i + 1, combo);
        combo.pop();
      }
    }
    helper(0, []);
    return result;
  }

  const peopleWithPrograms = people.filter((p) => p.programs.length > 0);
  const hasProgramData = peopleWithPrograms.length > 0;
  const canCalc = peopleWithPrograms.length >= 2;

  // Precompute location probs and all locations
  let allLocationProbs = [];
  let allLocations = new Set();
  if (canCalc) {
    allLocationProbs = peopleWithPrograms.map((p) => getLocationProbs(p.programs));
    allLocationProbs.forEach((probs) => {
      Object.keys(probs).forEach((loc) => allLocations.add(loc));
    });
  }

  // Compute all analyses
  const N = peopleWithPrograms.length;
  const everyoneSameProb = canCalc
    ? calcGroupSameLocationProb([...Array(N).keys()], allLocationProbs, allLocations)
    : null;
  const noOverlapProb = canCalc
    ? calcNoOverlapProb(allLocationProbs, allLocations)
    : null;

  // Group analyses for sizes 2 through N-1
  const groupAnalyses = [];
  if (canCalc) {
    for (let size = N - 1; size >= 2; size--) {
      const combos = combinations(N, size);
      const groupResults = combos.map((combo) => ({
        people: combo.map((i) => peopleWithPrograms[i].name),
        prob: calcGroupSameLocationProb(combo, allLocationProbs, allLocations),
      }));
      groupAnalyses.push({ size, results: groupResults });
    }
  }

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
        ) : !canCalc ? (
          <p className="empty-message">
            Add at least 2 people with programs to calculate probabilities.
          </p>
        ) : (
          <div className="prob-result">
            <div className="prob-card highlight">
              <span className="prob-label">Chance everyone ends up in the same location</span>
              <span className="prob-value">{(everyoneSameProb * 100).toFixed(1)}%</span>
            </div>
            <div className="prob-card">
              <span className="prob-label">Chance no one ends up in the same location</span>
              <span className="prob-value">{(noOverlapProb * 100).toFixed(1)}%</span>
            </div>

            {groupAnalyses.map(({ size, results }) => (
              <div key={size} className="prob-group">
                <h3 className="prob-group-title">
                  {size === 2 ? 'Pairs' : `Groups of ${size}`}
                </h3>
                {results.map((r, i) => (
                  <div className="prob-card" key={i}>
                    <span className="prob-label">{r.people.join(' & ')}</span>
                    <span className="prob-value">{(r.prob * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default App;

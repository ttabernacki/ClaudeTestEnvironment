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

  // P(exactly k out of N independent people end up at a given location)
  // Uses DP over independent Bernoulli trials
  function calcExactlyKAtLocation(loc, allLocationProbs) {
    const n = allLocationProbs.length;
    // dp[k] = P(exactly k of the first i people are at loc)
    let dp = new Array(n + 1).fill(0);
    dp[0] = 1;

    for (let i = 0; i < n; i++) {
      const pAt = allLocationProbs[i][loc] || 0;
      const pNot = 1 - pAt;
      const newDp = new Array(n + 1).fill(0);
      for (let k = 0; k <= i; k++) {
        newDp[k] += dp[k] * pNot;
        newDp[k + 1] += dp[k] * pAt;
      }
      dp = newDp;
    }

    return dp;
  }

  // Capitalize first letter of each word for display
  function displayLocation(loc) {
    return loc.replace(/\b\w/g, (c) => c.toUpperCase());
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

  // P(at least one person ends up alone — no one else in their city)
  // = 1 - P(every person shares a city with at least one other person)
  // Computed via: for each person, P(person i is alone) using other people's probs
  function calcSomeoneAloneProb(allLocationProbs, allLocations) {
    const n = allLocationProbs.length;
    // P(person i is alone) = sum over locations L of:
    //   P(i at L) * product over j≠i of P(j NOT at L)
    // Then use inclusion-exclusion... but that's complex.
    // Simpler: enumerate all location assignments (only feasible for small n).
    // For now, compute per-person P(alone) and use union bound approximation.
    // Actually, let's compute it exactly for each person and use inclusion-exclusion.

    // For each person, P(person i alone at their location)
    const pAlone = [];
    for (let i = 0; i < n; i++) {
      let prob = 0;
      for (const loc of allLocations) {
        const pIatLoc = allLocationProbs[i][loc] || 0;
        if (pIatLoc === 0) continue;
        let othersAwayProduct = 1;
        for (let j = 0; j < n; j++) {
          if (j === i) continue;
          othersAwayProduct *= 1 - (allLocationProbs[j][loc] || 0);
        }
        prob += pIatLoc * othersAwayProduct;
      }
      pAlone.push(prob);
    }
    return pAlone;
  }

  // Find the most likely city for the group (highest P(everyone there))
  function calcMostLikelySharedCity(allLocationProbs, allLocations) {
    let bestLoc = null;
    let bestProb = 0;
    for (const loc of allLocations) {
      let product = 1;
      for (const probs of allLocationProbs) {
        product *= probs[loc] || 0;
      }
      if (product > bestProb) {
        bestProb = product;
        bestLoc = loc;
      }
    }
    return { location: bestLoc, prob: bestProb };
  }

  // Per-city analyses: for each location, P(exactly k people end up there)
  const cityAnalyses = [];
  if (canCalc) {
    const sortedLocations = [...allLocations].sort();
    for (const loc of sortedLocations) {
      const dp = calcExactlyKAtLocation(loc, allLocationProbs);
      const counts = [];
      for (let k = 1; k <= N; k++) {
        if (dp[k] > 0.00005) {
          counts.push({ k, prob: dp[k] });
        }
      }
      if (counts.length > 0) {
        cityAnalyses.push({ location: loc, counts });
      }
    }
  }

  // Fun stats
  let funStats = [];
  if (canCalc) {
    const pAlone = calcSomeoneAloneProb(allLocationProbs, allLocations);
    const atLeastOnePairProb = 1 - noOverlapProb;
    const bestCity = calcMostLikelySharedCity(allLocationProbs, allLocations);
    const names = peopleWithPrograms.map((p) => p.name);

    // P(at least one person alone)
    // Union bound: P(A1 ∪ A2 ∪ ...) — use inclusion-exclusion with pairs for better approx
    // For small N, just use: 1 - P(no one alone) ≈ sum(pAlone) - sum(pAlone_i * pAlone_j) + ...
    // Simple approach: sum individual - we'll be approximate and it's for laughs
    const anyoneAlone = Math.min(1, pAlone.reduce((s, p) => s + p, 0));

    funStats = [
      {
        label: `Chance of a "long-distance situationship"`,
        value: noOverlapProb,
        show: true,
      },
      {
        label: `Chance someone's hate-swiping Hinge alone in a new city`,
        value: anyoneAlone,
        show: true,
      },
      {
        label: `Chance of an "accidental" co-resident hookup`,
        value: atLeastOnePairProb,
        show: true,
      },
      {
        label: `Chance you'll all be fighting over the same 1-bedroom apartment`,
        value: everyoneSameProb,
        show: true,
      },
      {
        label: `Chance of a "we should be roommates!" text you'll regret`,
        value: atLeastOnePairProb,
        show: N >= 2,
      },
      {
        label: `Most likely city for the group meltdown`,
        value: bestCity.prob,
        cityLabel: bestCity.location ? displayLocation(bestCity.location) : null,
        show: bestCity.location != null,
      },
      {
        label: `Chance ${names.length >= 2 ? names[0] + ' is sobbing alone on Match Day' : 'someone is sobbing alone'}`,
        value: pAlone[0],
        show: pAlone.length > 0,
      },
      {
        label: `Chance of a third wheel situation`,
        value: N >= 3
          ? (() => {
              // P(exactly 2 people together and 1+ alone)
              // Approximation: sum over pairs P(pair same city) * P(others not there)
              let prob = 0;
              const pairs = combinations(N, 2);
              for (const [a, b] of pairs) {
                for (const loc of allLocations) {
                  const pA = allLocationProbs[a][loc] || 0;
                  const pB = allLocationProbs[b][loc] || 0;
                  let othersAway = 1;
                  for (let j = 0; j < N; j++) {
                    if (j === a || j === b) continue;
                    othersAway *= 1 - (allLocationProbs[j][loc] || 0);
                  }
                  prob += pA * pB * othersAway;
                }
              }
              return prob;
            })()
          : 0,
        show: N >= 3,
      },
      {
        label: `Chance of drunk Match Day texts you'll regret`,
        value: 1.0,
        show: true,
        isJoke: true,
      },
    ];
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

            {cityAnalyses.length > 0 && (
              <div className="prob-group">
                <h3 className="prob-group-title">By City</h3>
                {cityAnalyses.map(({ location, counts }) => (
                  <div key={location} className="city-analysis">
                    <h4 className="city-name">{displayLocation(location)}</h4>
                    {counts.map(({ k, prob }) => (
                      <div className="prob-card" key={k}>
                        <span className="prob-label">
                          {k === N
                            ? 'Everyone'
                            : k === 1
                              ? 'Exactly 1 person'
                              : `Exactly ${k} people`}
                        </span>
                        <span className="prob-value">{(prob * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {funStats.length > 0 && (
              <div className="prob-group fun-stats">
                <h3 className="prob-group-title fun-title">The Real Stats Nobody Asked For</h3>
                {funStats.filter((s) => s.show).map((stat, i) => (
                  <div className={`prob-card fun-card${stat.isJoke ? ' joke' : ''}`} key={i}>
                    <span className="prob-label">
                      {stat.label}
                      {stat.cityLabel && (
                        <span className="fun-city"> ({stat.cityLabel})</span>
                      )}
                    </span>
                    <span className="prob-value fun-value">
                      {stat.isJoke ? '100%' : `${(stat.value * 100).toFixed(1)}%`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default App;

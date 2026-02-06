import { useState, useEffect } from 'react';
import PersonColumn from './components/PersonColumn';
import ProbabilitySliders from './components/ProbabilitySliders';
import './App.css';

const DEFAULT_RANK_PROBS = {
  rank1: 50,
  rank2: 25,
  rank3: 15,
  rank4plus: 10,
};

const DEFAULT_PEOPLE = [
  {
    id: 'default-tomasz', name: 'Tomasz', included: true,
    programs: [
      { id: 't-1', name: 'Cornell', location: 'NYC' },
      { id: 't-2', name: 'Sinai', location: 'NYC' },
      { id: 't-3', name: 'Columbia', location: 'NYC' },
      { id: 't-4', name: 'NYU-Tisch', location: 'NYC' },
      { id: 't-5', name: 'NYU-Bellvue', location: 'NYC' },
      { id: 't-6', name: 'Beth Israel', location: 'Boston' },
      { id: 't-7', name: 'HUP', location: 'Philadelphia' },
      { id: 't-8', name: 'Northwestern', location: 'Chicago' },
      { id: 't-9', name: 'UCLA', location: 'LA' },
      { id: 't-10', name: 'Thomas Jefferson', location: 'Philadelphia' },
    ],
  },
  {
    id: 'default-elliot', name: 'Elliot', included: true,
    programs: [
      { id: 'e-1', name: 'Columbia', location: 'NYC' },
      { id: 'e-2', name: 'Sinai', location: 'NYC' },
      { id: 'e-3', name: 'NYU-Tisch', location: 'NYC' },
      { id: 'e-4', name: 'MGH', location: 'Boston' },
      { id: 'e-5', name: 'Johns Hopkins', location: 'Baltimore' },
    ],
  },
  {
    id: 'default-matt', name: 'Matt', included: true,
    programs: [
      { id: 'm-1', name: 'Cornell', location: 'NYC' },
      { id: 'm-2', name: 'Sinai', location: 'NYC' },
      { id: 'm-3', name: 'Columbia', location: 'NYC' },
      { id: 'm-4', name: 'NYU-Tisch', location: 'NYC' },
      { id: 'm-5', name: 'NYU-Bellvue', location: 'NYC' },
      { id: 'm-6', name: 'MGH', location: 'Boston' },
      { id: 'm-7', name: 'Beth Israel', location: 'Boston' },
      { id: 'm-8', name: 'BWH', location: 'Boston' },
      { id: 'm-9', name: 'UCLA', location: 'LA' },
      { id: 'm-10', name: 'Colorado', location: 'Denver' },
      { id: 'm-11', name: 'Northwestern', location: 'Chicago' },
      { id: 'm-12', name: 'UChicago', location: 'Chicago' },
      { id: 'm-13', name: 'Thomas Jefferson', location: 'Philadelphia' },
      { id: 'm-14', name: 'CCF', location: 'Cleveland' },
      { id: 'm-15', name: 'UH', location: 'Cleveland' },
    ],
  },
  {
    id: 'default-kate', name: 'Kate', included: true,
    programs: [
      { id: 'ka-1', name: 'Sinai', location: 'NYC' },
      { id: 'ka-2', name: 'Beth Israel', location: 'Boston' },
    ],
  },
  {
    id: 'default-katelyn', name: 'Katelyn', included: true,
    programs: [
      { id: 'kn-1', name: 'Sinai', location: 'NYC' },
      { id: 'kn-2', name: 'NYU', location: 'NYC' },
    ],
  },
  {
    id: 'default-elad', name: 'Elad', included: true,
    programs: [
      { id: 'el-1', name: 'Sinai', location: 'NYC' },
      { id: 'el-2', name: 'Cooper', location: 'Philadelphia' },
      { id: 'el-3', name: 'CCF', location: 'Cleveland' },
      { id: 'el-4', name: 'Colorado', location: 'Denver' },
      { id: 'el-5', name: 'UMass', location: 'Boston' },
    ],
  },
  {
    id: 'default-david', name: 'David', included: true,
    programs: [
      { id: 'd-1', name: 'Northwestern', location: 'Chicago' },
      { id: 'd-2', name: 'MGH', location: 'Boston' },
      { id: 'd-3', name: 'UPMC', location: 'Pittsburgh' },
      { id: 'd-4', name: 'HUP', location: 'Philadelphia' },
      { id: 'd-5', name: 'Michigan', location: 'Michigan' },
    ],
  },
];

function loadFromStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function App() {
  const [people, setPeople] = useState(() => loadFromStorage('rmc-people', DEFAULT_PEOPLE));
  const [newPersonName, setNewPersonName] = useState('');
  const [rankProbs, setRankProbs] = useState(() => loadFromStorage('rmc-rankProbs', DEFAULT_RANK_PROBS));

  // Persist to localStorage on every change
  useEffect(() => {
    localStorage.setItem('rmc-people', JSON.stringify(people));
  }, [people]);

  useEffect(() => {
    localStorage.setItem('rmc-rankProbs', JSON.stringify(rankProbs));
  }, [rankProbs]);

  function addPerson(e) {
    e.preventDefault();
    const name = newPersonName.trim();
    if (!name) return;
    setPeople((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name, programs: [], included: true },
    ]);
    setNewPersonName('');
  }

  function removePerson(personId) {
    setPeople((prev) => prev.filter((p) => p.id !== personId));
  }

  function toggleIncluded(personId) {
    setPeople((prev) =>
      prev.map((p) =>
        p.id === personId ? { ...p, included: !p.included } : p
      )
    );
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

  const peopleWithPrograms = people.filter((p) => p.programs.length > 0 && p.included !== false);
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
      groupResults.sort((a, b) => b.prob - a.prob);
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
        counts.sort((a, b) => b.prob - a.prob);
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

    const anyoneAlone = Math.min(1, pAlone.reduce((s, p) => s + p, 0));

    // Helper: find person index by name (case-insensitive)
    function findPerson(name) {
      const idx = peopleWithPrograms.findIndex(
        (p) => p.name.toLowerCase() === name.toLowerCase()
      );
      return idx >= 0 ? idx : null;
    }

    // Helper: P(a set of people all in the same city)
    function pGroupSameCity(indices) {
      if (indices.some((i) => i === null)) return null;
      return calcGroupSameLocationProb(indices, allLocationProbs, allLocations);
    }

    // Helper: P(a set of people all at the same PROGRAM — ranked identically)
    // For professionalism: P(any subset of given people match at the same program)
    function pSameProgramAny(indices) {
      if (indices.some((i) => i === null)) return null;
      const valid = indices.filter((i) => i !== null);
      if (valid.length < 2) return null;
      // For each program name, P(all of them match there)
      // Collect all program names across valid people
      const programsByPerson = valid.map((idx) => {
        const progs = peopleWithPrograms[idx].programs;
        const rankValues = [rankProbs.rank1, rankProbs.rank2, rankProbs.rank3];
        const numFourPlus = Math.max(0, progs.length - 3);
        const fourPlusEach = numFourPlus > 0 ? rankProbs.rank4plus / numFourPlus : 0;
        const map = {};
        progs.forEach((prog, i) => {
          const key = prog.name.toLowerCase().trim();
          const p = i < 3 ? rankValues[i] / 100 : fourPlusEach / 100;
          map[key] = (map[key] || 0) + p;
        });
        return map;
      });
      const allPrograms = new Set();
      programsByPerson.forEach((m) => Object.keys(m).forEach((k) => allPrograms.add(k)));
      let total = 0;
      for (const prog of allPrograms) {
        let product = 1;
        for (const personProgs of programsByPerson) {
          product *= personProgs[prog] || 0;
        }
        total += product;
      }
      return total;
    }

    // Helper: P(given people both in a specific city)
    function pGroupAtCity(indices, cityName) {
      if (indices.some((i) => i === null)) return null;
      const loc = cityName.toLowerCase().trim();
      let product = 1;
      for (const idx of indices) {
        product *= allLocationProbs[idx][loc] || 0;
      }
      return product;
    }

    // Accidental resident orgy: P(3+ people in same city), or P(2+ if only 2)
    const orgyProb = (() => {
      // Sum over all locations: P(3+ at that location), or if N<3, P(2+ at location)
      const minK = Math.min(3, N);
      let prob = 0;
      for (const loc of allLocations) {
        const dp = calcExactlyKAtLocation(loc, allLocationProbs);
        for (let k = minK; k <= N; k++) {
          prob += dp[k];
        }
      }
      return Math.min(1, prob);
    })();

    // Find specific people
    const tomaszIdx = findPerson('Tomasz');
    const mattIdx = findPerson('Matt');
    const elliotIdx = findPerson('Elliot');
    const katelynIdx = findPerson('Katelyn');
    const kateIdx = findPerson('Kate');

    // Professionalism violation: increases with Tomasz, Matt, Elliot at same program
    const profGroup = [tomaszIdx, mattIdx, elliotIdx].filter((i) => i !== null);
    const profViolationProb = profGroup.length >= 2
      ? pSameProgramAny(profGroup)
      : null;

    // Voyeurism: P increases with Katelyn and Kate same city
    const voyeurismProb = katelynIdx !== null && kateIdx !== null
      ? pGroupSameCity([katelynIdx, kateIdx])
      : null;

    // Townhall: P increases with Katelyn and Kate in Cleveland
    const townhallProb = katelynIdx !== null && kateIdx !== null
      ? pGroupAtCity([katelynIdx, kateIdx], 'cleveland')
      : null;

    // Fear level of twinks: Elliot and Matt same city
    const twinkFearProb = elliotIdx !== null && mattIdx !== null
      ? pGroupSameCity([elliotIdx, mattIdx])
      : null;

    // P(at least 2 people alone in different cities — the group chat is all that's left)
    const scatteredProb = noOverlapProb;

    // P(someone matches at their last choice)
    const lastChoiceProb = (() => {
      let prob = 0;
      for (let i = 0; i < N; i++) {
        const progs = peopleWithPrograms[i].programs;
        if (progs.length === 0) continue;
        const lastLoc = progs[progs.length - 1].location.toLowerCase().trim();
        const lastProb = progs.length <= 3
          ? [rankProbs.rank1, rankProbs.rank2, rankProbs.rank3][progs.length - 1] / 100
          : (rankProbs.rank4plus / Math.max(1, progs.length - 3)) / 100;
        prob += lastProb;
      }
      return Math.min(1, prob);
    })();

    funStats = [
      {
        label: `Chance we all drop out of medicine and move to Berlin`,
        desc: `P(no two people in the same city)`,
        value: noOverlapProb,
        show: true,
      },
      {
        label: `Chance someone's hate-swiping Hinge alone in a new city`,
        desc: `P(at least one person has no one else in their city)`,
        value: anyoneAlone,
        show: true,
      },
      {
        label: `Chance of accidental resident orgy`,
        desc: `P(${Math.min(3, N)}+ people end up in the same city)`,
        value: orgyProb,
        show: true,
      },
      {
        label: `Chance you'll all be fighting over the same 1-bedroom apartment`,
        desc: `P(everyone in the same city)`,
        value: everyoneSameProb,
        show: true,
      },
      {
        label: `Officially Designated Rat Kingdom`,
        desc: `City most likely to contain the entire group`,
        value: bestCity.prob,
        cityLabel: bestCity.location ? displayLocation(bestCity.location) : null,
        show: bestCity.location != null,
      },
      {
        label: `Chance ${names.length >= 2 ? names[0] + ' is sobbing alone on Match Day' : 'someone is sobbing alone'}`,
        desc: `P(${names[0] || 'first person'} ends up in a city with none of you)`,
        value: pAlone[0],
        show: pAlone.length > 0,
      },
      {
        label: `Chance of a third wheel situation`,
        desc: `P(exactly 2 people in a city while someone else is alone)`,
        value: N >= 3
          ? (() => {
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
        label: `Chance the group chat becomes long-distance therapy`,
        desc: `P(everyone in a different city)`,
        value: scatteredProb,
        show: N >= 3,
      },
      {
        label: `Chance someone rage-applies to a fellowship immediately`,
        desc: `P(someone matches at their last-ranked program)`,
        value: lastChoiceProb,
        show: true,
      },
      {
        label: `Chance of "I'm literally moving to your city" energy`,
        desc: `P(at least one pair in the same city)`,
        value: atLeastOnePairProb,
        show: true,
      },
      {
        label: `Chance of professionalism violation`,
        desc: `P(Tomasz, Matt, and/or Elliot match at the same program)`,
        value: profViolationProb,
        show: profViolationProb !== null,
      },
      {
        label: `Chance of voyeurism`,
        desc: `P(Katelyn and Kate end up in the same city)`,
        value: voyeurismProb,
        show: voyeurismProb !== null,
      },
      {
        label: `Chance of going to Townhall`,
        desc: `P(Katelyn and Kate both match in Cleveland)`,
        value: townhallProb,
        show: townhallProb !== null,
      },
      {
        label: `Fear level of twinks`,
        desc: `P(Elliot and Matt end up in the same city)`,
        value: twinkFearProb,
        show: twinkFearProb !== null,
      },
      {
        label: `Chance of Berlin 2027 Trip`,
        desc: `This is not a probability. This is a promise.`,
        value: 1.0,
        show: true,
        isJoke: true,
      },
    ];
    // Sort: jokes always last, then by probability descending
    funStats.sort((a, b) => {
      if (a.isJoke && !b.isJoke) return 1;
      if (!a.isJoke && b.isJoke) return -1;
      return (b.value || 0) - (a.value || 0);
    });
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>RatMatch</h1>
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
              onToggleIncluded={toggleIncluded}
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
            {funStats.length > 0 && (
              <div className="prob-group fun-stats">
                <h3 className="prob-group-title fun-title">The Real Stats Nobody Asked For</h3>
                {funStats.filter((s) => s.show).map((stat, i) => (
                  <div className={`prob-card fun-card${stat.isJoke ? ' joke' : ''}`} key={i}>
                    <div className="prob-label">
                      <span>{stat.label}</span>
                      {stat.cityLabel && (
                        <span className="fun-city"> ({stat.cityLabel})</span>
                      )}
                      {stat.desc && (
                        <span className="fun-desc">{stat.desc}</span>
                      )}
                    </div>
                    <span className="prob-value fun-value">
                      {stat.isJoke ? '100%' : `${(stat.value * 100).toFixed(1)}%`}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="prob-group">
              <h3 className="prob-group-title">Overall</h3>
              <div className="prob-card highlight">
                <span className="prob-label">Chance everyone ends up in the same location</span>
                <span className="prob-value">{(everyoneSameProb * 100).toFixed(1)}%</span>
              </div>
              <div className="prob-card">
                <span className="prob-label">Chance no one ends up in the same location</span>
                <span className="prob-value">{(noOverlapProb * 100).toFixed(1)}%</span>
              </div>
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
          </div>
        )}
      </section>
    </div>
  );
}

export default App;

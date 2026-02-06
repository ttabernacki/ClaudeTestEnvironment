import { useState } from 'react';
import PersonColumn from './components/PersonColumn';
import './App.css';

function App() {
  const [people, setPeople] = useState([]);
  const [newPersonName, setNewPersonName] = useState('');

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

  return (
    <div className="app">
      <header className="app-header">
        <h1>Residency Match Calculator</h1>
        <p>Add people and build each person's rank list.</p>
      </header>

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
        {people.length === 0 || people.every((p) => p.programs.length === 0) ? (
          <p className="empty-message">
            Add people and programs to see probabilities.
          </p>
        ) : (
          <p className="empty-message">Probability calculations coming soon.</p>
        )}
      </section>
    </div>
  );
}

export default App;

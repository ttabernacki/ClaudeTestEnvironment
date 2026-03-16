import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import SortableProgram from './SortableProgram';

export default function PersonColumn({ person, onRemovePerson, onUpdatePrograms, onToggleIncluded }) {
  const [newProgram, setNewProgram] = useState('');
  const [newLocation, setNewLocation] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onUpdatePrograms(person.id, (items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  function handleAddProgram(e) {
    e.preventDefault();
    const name = newProgram.trim();
    const location = newLocation.trim();
    if (!name || !location) return;
    onUpdatePrograms(person.id, (prev) => [
      ...prev,
      { id: crypto.randomUUID(), name, location },
    ]);
    setNewProgram('');
    setNewLocation('');
  }

  function handleRemoveProgram(programId) {
    onUpdatePrograms(person.id, (prev) => prev.filter((p) => p.id !== programId));
  }

  return (
    <div className={`person-column${person.included === false ? ' excluded' : ''}${person.matched ? ' matched' : ''}`}>
      <div className="person-header">
        <label className="include-toggle" title={person.included === false ? 'Excluded from calculations' : 'Included in calculations'}>
          <input
            type="checkbox"
            checked={person.included !== false}
            onChange={() => onToggleIncluded(person.id)}
          />
        </label>
        <h3 className="person-name">{person.name}</h3>
        <button
          className="remove-person-btn"
          onClick={() => onRemovePerson(person.id)}
          aria-label={`Remove ${person.name}`}
        >
          ×
        </button>
      </div>

      {person.matched ? (
        <div className="matched-status">
          <p className="matched-label">Matched</p>
          <div className="matched-program">
            {person.programs.find(p => p.location.toLowerCase().trim() === person.matchedLocation.toLowerCase().trim())?.name || 'Unknown Program'}
          </div>
        </div>
      ) : (
        <>
          <form className="add-program-form" onSubmit={handleAddProgram}>
            <input
              type="text"
              value={newProgram}
              onChange={(e) => setNewProgram(e.target.value)}
              placeholder="Program name…"
              aria-label={`Add program for ${person.name}`}
            />
            <input
              type="text"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="Location…"
              aria-label={`Program location for ${person.name}`}
            />
            <button type="submit">Add</button>
          </form>

          {person.programs.length === 0 ? (
            <p className="empty-message-small">No programs yet.</p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis]}
            >
              <SortableContext items={person.programs} strategy={verticalListSortingStrategy}>
                <div className="rank-list">
                  {person.programs.map((program, index) => (
                    <SortableProgram
                      key={program.id}
                      id={program.id}
                      rank={index + 1}
                      name={program.name}
                      location={program.location}
                      onRemove={handleRemoveProgram}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </>
      )}
    </div>
  );
}

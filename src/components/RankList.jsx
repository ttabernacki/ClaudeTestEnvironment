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

export default function RankList({ programs, setPrograms }) {
  const [newProgram, setNewProgram] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setPrograms((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  function handleAdd(e) {
    e.preventDefault();
    const name = newProgram.trim();
    if (!name) return;
    setPrograms((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name },
    ]);
    setNewProgram('');
  }

  function handleRemove(id) {
    setPrograms((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <section className="rank-list-section">
      <h2>Your Rank List</h2>

      <form className="add-program-form" onSubmit={handleAdd}>
        <input
          type="text"
          value={newProgram}
          onChange={(e) => setNewProgram(e.target.value)}
          placeholder="Enter program name…"
          aria-label="Program name"
        />
        <button type="submit">Add Program</button>
      </form>

      {programs.length === 0 ? (
        <p className="empty-message">
          No programs yet. Add a residency program above to get started.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext items={programs} strategy={verticalListSortingStrategy}>
            <div className="rank-list">
              {programs.map((program, index) => (
                <SortableProgram
                  key={program.id}
                  id={program.id}
                  rank={index + 1}
                  name={program.name}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </section>
  );
}

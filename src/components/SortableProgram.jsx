import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function SortableProgram({ id, rank, name, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`rank-item${isDragging ? ' dragging' : ''}`}>
      <span className="rank-number">{rank}</span>
      <button className="drag-handle" {...attributes} {...listeners} aria-label="Drag to reorder">
        ⠿
      </button>
      <span className="program-name">{name}</span>
      <button className="remove-btn" onClick={() => onRemove(id)} aria-label={`Remove ${name}`}>
        ×
      </button>
    </div>
  );
}

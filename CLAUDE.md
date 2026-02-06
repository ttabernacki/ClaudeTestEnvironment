# CLAUDE.md - Project Guide for Claude Code

## Repository
Residency Match Calculator — a React webapp where users build a residency rank list (drag-and-drop) and view match probabilities.

## Commands
- `npm install` — install dependencies
- `npm run dev` — start dev server (Vite)
- `npm run build` — production build
- `npm run preview` — preview production build

## Tech Stack
- React 19 + Vite
- @dnd-kit (core, sortable, utilities, modifiers) for drag-and-drop

## Code Style & Conventions
- Functional components with hooks
- CSS in plain `.css` files (no CSS-in-JS)
- Components live in `src/components/`
- State lifted to App and passed via props

## Project Structure
```
src/
├── App.jsx                     # Root component — holds program state
├── App.css                     # App-level styles
├── index.css                   # Global reset/base styles
├── main.jsx                    # Entry point
└── components/
    ├── RankList.jsx             # Drag-and-drop rank list + add form
    └── SortableProgram.jsx      # Single draggable rank item
```

## Testing
- No test framework configured yet. Update this section when tests are added.

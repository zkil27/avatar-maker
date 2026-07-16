# Project: Avatar Maker

## Architecture
- React application built with Vite.
- Static assets (character base, hair, eyes, mouth, accessories) layered visually.
- State: Selected options for each category, composited onto a Canvas.
- Styling: Responsive design using CSS/Tailwind, optimized for mobile (375x667) and desktop.
- Export: Uses HTML Canvas API (or an alternative like client-side canvas blob generation) to composite image layers and download them as a PNG.

## Milestones
| # | Name | Scope | Dependencies | Status | Conversation ID |
|---|------|-------|-------------|--------|-----------------|
| 1 | Setup E2E Test Suite | Create testing framework, mock assets, first test files, and TEST_READY.md | none | DONE | 4db811f0-87d0-4edc-b676-5ce3e3136e8e |
| 2 | Setup App Base & Config | Initialize Vite+React app, Tailwind CSS, structure, basic scripts, layout | none | DONE | 406b26f2-6a57-4429-a9df-48e18d31a5d8 |
| 3 | Customization & Layers | Implement UI category navigation, state selection, rendering layers with SVGs/placeholder assets | M2 | IN_PROGRESS | 8a1a6847-a1de-40b4-b7bb-a7f5ffbbb47c |
| 4 | Canvas & Composite | Live responsive preview canvas composite of overlapping layers | M3 | PLANNED | |
| 5 | Export & Save | Implement PNG download trigger from the composited layers | M4 | PLANNED | |
| 6 | E2E Suite Integration & Hardening | Run all E2E tests, fix remaining bugs, perform white-box adversarial coverage hardening | M1, M5 | PLANNED | |

## Interface Contracts
### Category Config & Asset Structure
- A structure defining customization options (hair, eyes, mouth, hats, glasses).
- Each category has multiple items, each with a unique ID, layer z-index, and source image/SVG path.
- The layer ordering (z-index):
  1. Base Character (lowest)
  2. Mouth
  3. Eyes
  4. Hair
  5. Glasses
  6. Hats (highest)

## Code Layout
- `src/`
  - `components/`
    - `AvatarCanvas.jsx` (Responsive canvas layer rendering)
    - `CustomizationControls.jsx` (Mobile-friendly UI for selectors)
  - `constants/`
    - `categories.js` (Option definitions)
  - `assets/` (SVG or PNG asset assets for character components)
  - `App.jsx` (Main wrapper coordinating state)
  - `main.jsx`
- `tests/`
  - Unit/integration/E2E test files
- `package.json`
- `vite.config.js`

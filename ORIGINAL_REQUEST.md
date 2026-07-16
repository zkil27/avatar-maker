# Original User Request

## Initial Request — 2026-07-14T18:15:01Z

An avatar creator web application similar to Picrew, allowing users to customize character features like hair, eyes, mouth, and accessories (hats, glasses). Built using Vite + React. The app should be mobile-friendly and easy to run, with basic logic and placeholder assets implemented first.

Working directory: c:/dev/avatar maker
Integrity mode: development

## Requirements

### R1. Avatar Customization Interface
Provide a mobile-friendly UI where users can toggle through different categories (hair, eyes, mouth, hats, glasses) and select different options for their avatar. 

### R2. Responsive Canvas/Preview
Display a live preview of the avatar that updates instantly when options are selected. The preview should layer the selected placeholder assets correctly.

### R3. Export/Save Functionality
Allow users to download their finished avatar image.

## Acceptance Criteria

### Automated Verification
- [ ] A test script exists (e.g. using Vitest/React Testing Library) that mounts the main application and verifies that clicking an option updates the selected state.
- [ ] The app successfully builds using `npm run build` without any errors.

### Visual / Agent-as-Judge Verification
- [ ] The application is responsive and the customization controls are usable on a mobile viewport constraint (e.g. 375x667).
- [ ] The canvas successfully composites at least 3 overlapping image layers (e.g., base character, hair, glasses).
- [ ] Clicking the "download" or "save" button triggers a file download of the composited image.

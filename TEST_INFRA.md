# Test Infrastructure Documentation

## Testing Stack Recommendation
To build a fast, reliable, and opaque-box test suite for the Vite + React Avatar Maker application, we use:

* **Vitest**: The test runner. Highly optimized, extremely fast, ESM native, sharing configuration with Vite.
* **JSDOM**: Node-simulated browser DOM environment, enabling lightweight rendering and state assertions without browser overhead.
* **React Testing Library**: Opaque-box UI component querying and event dispatching.

## Canvas Mocking Strategy
Since JSDOM does not natively support HTML5 Canvas drawing APIs, we manually mock the canvas context on the `HTMLCanvasElement.prototype` in `tests/setup.js`.

The mock implements:
1. `getContext('2d')` returning spies (`vi.fn()`) for clearRect, fillRect, drawImage, etc.
2. `toDataURL()` returning a mocked PNG base64 string (`data:image/png;base64,mockDataURL`).
3. Asynchronous loading in a custom `global.Image` mock, simulating `onload` and `onerror` hooks under JSDOM.

## Directory Layout
* `tests/`
  * `setup.js` — Test setup, Canvas & Image API mocks
  * `avatar-maker.test.jsx` — 38 comprehensive test cases across Tiers 1-4
* `package.json` — Defines devDependencies (Vitest, RTL, JSDOM) and test scripts
* `vite.config.js` — Bundler and test configuration pointing to `tests/setup.js`

## Commands to Run Tests
* Run tests interactively (watch mode):
  ```bash
  npm run test
  ```
* Run tests once (CI/automated mode):
  ```bash
  npm run test:run
  ```

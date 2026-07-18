import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  vite: {
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
  },
});

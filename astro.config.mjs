import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://sledrun.app',
  output: 'static',
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
});

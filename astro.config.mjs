import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://sledrun.online',
  output: 'static',
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
});

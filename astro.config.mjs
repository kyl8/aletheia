import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://aletheia.kyl8.dev',
  output: 'static',
  integrations: [svelte()],
  vite: {
    plugins: [tailwindcss()],
    build: { target: 'esnext' },
    optimizeDeps: {
      exclude: [
        '@myriaddreamin/typst.ts',
        '@myriaddreamin/typst-ts-web-compiler',
        '@myriaddreamin/typst-ts-renderer'
      ]
    }
  }
});

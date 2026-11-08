import { defineConfig } from 'vite';

export default defineConfig({
  root: 'client',
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
    rollupOptions: {
      output: {
        // Vite 8 uses Rolldown, which requires manualChunks as a function.
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three';
        }
      }
    }
  },
  server: { port: 5180, host: '127.0.0.1' }
});

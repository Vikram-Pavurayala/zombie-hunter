import { defineConfig } from 'vite';

export default defineConfig({
  // Basic Vite configuration for a simple project
  root: '.', // set the root directory for the project
  publicDir: 'public', // directory for static assets
  build: {
    outDir: 'dist', // output directory for production build
    rollupOptions: {
      // Configure how modules are bundled
      input: {
        main: './index.html' // main entry point
      }
    }
  },
  // Optional: Add any specific resolver or plugin configurations
  resolve: {
    alias: {
      // If you need to resolve specific path aliases
      // '@': '/src'
    }
  }
});

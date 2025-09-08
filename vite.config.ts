import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    sveltekit(),
    // Bundle analyzer - only in build mode
    process.env.ANALYZE && visualizer({
      filename: 'dist/bundle-analysis.html',
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ],

  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Google AI services - loaded only when needed
          if (id.includes('@google/genai')) {
            return 'vendor-google';
          }
          // Core UI components that are always needed
          if (id.includes('node_modules')) {
            return 'vendor';
          }
          // Dynamic imports will be automatically split by Vite
        }
      }
    },
    // Enable chunk size warnings for optimization monitoring
    chunkSizeWarningLimit: 500
  }
})

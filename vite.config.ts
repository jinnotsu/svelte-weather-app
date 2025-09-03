import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  server: {
    proxy: {
      '/api/tenki': {
        target: 'https://tenki.jp',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tenki/, '')
      }
    }
  }
})

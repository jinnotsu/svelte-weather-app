import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [sveltekit()],
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

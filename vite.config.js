import { defineConfig } from 'vite'

export default defineConfig({
  base: '/',  // Change to '/ghostHouse/' for GitHub Pages subdirectory
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
})

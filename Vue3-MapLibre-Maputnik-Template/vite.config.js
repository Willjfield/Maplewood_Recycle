import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 8080,
  },
  publicPath: "./",
  build:{
    outDir: process.env.VUE_APP_ENV === 'PROD'
    ? 'build-prod'
    : 'build-dev'
  }
})

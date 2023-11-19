import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base:"/static",
  build:{
    manifest:true,
    outDir:'./src/assets',
    rollupOptions:{
      input:'./src/main.jsx'
    },
  },
})

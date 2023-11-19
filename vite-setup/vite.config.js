import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base:"static",
  build:{
    manifest:true,
    outDir:'./vite-setup/src/dist',
    rollupOptions:{
      input:{
        base:'./src/main.jsx'
      },
    },
  },
})

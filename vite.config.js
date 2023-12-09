import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base:"/",
  server: {
    origin: 'http://127.0.0.1:5173',
  },
  build:{
    manifest:true,
    outDir:'./static/src/dist',
    rollupOptions:{
      input:{
        main:'./static/src/main.jsx',
        project:'./static/src/project-template.jsx',
      }
      },
    },
  },
)

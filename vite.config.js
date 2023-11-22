import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base:"/static/",
  server: {
    origin: 'http://127.0.0.1:5173',
  },
  build:{
    manifest:true,
    outDir:'./src/dist',
    rollupOptions:{
      input:{
        main:'./src/main.jsx',
      }
      },
    },
  },
)

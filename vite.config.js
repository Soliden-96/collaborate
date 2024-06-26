import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base:"/",
  server: {
    origin: 'http://127.0.0.1:5173',
  },
  define: {
    "process.env.IS_PREACT": JSON.stringify("true"),
  },
  build:{
    manifest:true,
    outDir:'/service/static/src/dist',
    rollupOptions:{
      input:{
        main:'/service/static/src/main.jsx',
        project:'/service/static/src/project-template.jsx',
      }
      },
    },
  }, 
)

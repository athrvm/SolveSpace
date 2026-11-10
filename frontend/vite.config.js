import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Keep the preview on the origin already allowed by the existing API.
  server: { host: 'localhost', port: 5173, strictPort: true },
  plugins: [react(), tailwindcss()],
})

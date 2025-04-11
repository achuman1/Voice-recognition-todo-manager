import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: "Voice-recognition-todo-manager",  // 👈 Add this line
})

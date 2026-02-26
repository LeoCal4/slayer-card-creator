import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.join(__dirname, 'src'),
      'react-konva': path.join(__dirname, 'src/test/mocks/react-konva.tsx'),
      'konva': path.join(__dirname, 'src/test/mocks/konva.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/dist-electron/**'],
  },
})

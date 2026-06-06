import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      https: 'agent-base',
      http: 'agent-base',
      zlib: 'browserify-zlib',
      util: 'util',
      stream: 'stream-browserify',
      assert: 'assert',
      buffer: 'buffer',
    },
    dedupe: [
      'react',
      'react-dom',
      '@emotion/react',
      '@emotion/styled',
      '@mui/material',
      '@mui/system',
      '@mui/styled-engine',
    ],
  },
  optimizeDeps: {
    force: true,
    include: [
      '@emotion/react',
      '@emotion/styled',
      '@mui/material',
      '@mui/material/Autocomplete',
      '@mui/material/Menu',
      '@mui/material/Popper',
      '@mui/material/Tooltip',
      '@mui/system',
      '@mui/styled-engine',
      'sockjs-client',
      'buffer',
      'util',
      'stream-browserify',
      'assert',
      'browserify-zlib'
    ],
  },
  define: {
    global: 'window',
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
  },
  server: {
    port: 5173,
    host: true
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts'
  }
})


import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@hooks': '/src/hooks',
      '@services': '/src/services',
      '@store': '/src/store',
      '@types': '/src/types',
      '@utils': '/src/utils'
    }
  },
  optimizeDeps: {
    include: ['monaco-editor'],
    exclude: ['monaco-editor/esm/vs/editor/editor.worker', 'monaco-editor/esm/vs/language/json/json.worker', 'monaco-editor/esm/vs/language/css/css.worker', 'monaco-editor/esm/vs/language/html/html.worker', 'monaco-editor/esm/vs/language/typescript/ts.worker']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'monaco-editor': ['monaco-editor'],
          'vendor': ['react', 'react-dom', 'zustand'],
          'utils': ['jszip', 'file-saver']
        }
      }
    }
  }
});
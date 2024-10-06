import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    exclude: [
      'react',
      'react-dom'
    ]
  },
  resolve: {
    alias: {
      react: "@matthewp/untitled-framework",
      'react-dom': "@matthewp/untitled-framework/dom",
    },
  },
});

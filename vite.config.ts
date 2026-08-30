import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],

  resolve: {
    alias: {
      '@reticentrahul/recipe-planner': '@reticentrahul/recipe-planner'
    }
  },

  ssr: {
    external: ['@reticentrahul/recipe-planner']
  },

  optimizeDeps: {
    exclude: [
      '@reticentrahul/recipe-planner',
      '@reticentrahul/recipe-planner/loader'
    ]
  },

  build: {
    rollupOptions: {
      external: ['@reticentrahul/recipe-planner'],
      output: {
        globals: {
          '@reticentrahul/recipe-planner': 'recipeComponents'
        }
      }
    }
  }
});
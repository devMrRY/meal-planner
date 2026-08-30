/**
 * Custom loader for Stencil components in SvelteKit.
 * Use the package's supported loader entry instead of deep imports
 * because Netlify/npm package exports do not expose dist component files.
 */

import { defineCustomElements as loadStencil } from '@reticentrahul/recipe-planner/loader';

export const defineCustomElements = async (win?: Window) => {
  const windowInstance = win ?? globalThis.window;

  if (typeof windowInstance === 'undefined') {
    return;
  }

  try {
    console.log('Initializing Stencil components...');

    // Use Stencil's supported loader entry point.
    await loadStencil(windowInstance);

    console.log('✓ Stencil components initialized successfully');
  } catch (error) {
    console.error('✗ Failed to initialize Stencil components:', error);
    throw error;
  }
};



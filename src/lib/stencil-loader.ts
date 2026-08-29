/**
 * Custom loader for Stencil components in SvelteKit
 * Directly registers each component to avoid lazy loading issues
 */

export const defineCustomElements = async (win?: Window) => {
  const window = win || globalThis.window;
  
  if (typeof window === 'undefined') {
    return;
  }

  try {
    console.log('Initializing Stencil components...');

    // Import and register each component individually
    // This avoids the lazy loading mechanism that has issues with Vite
    const componentModules = await Promise.all([
      import('@reticentrahul/recipe-planner/dist/components/app-modal.js'),
      import('@reticentrahul/recipe-planner/dist/components/recipe-form.js'),
      import('@reticentrahul/recipe-planner/dist/components/recipe-card.js'),
      import('@reticentrahul/recipe-planner/dist/components/recipe-detail.js'),
      import('@reticentrahul/recipe-planner/dist/components/recipe-list.js'),
      import('@reticentrahul/recipe-planner/dist/components/meal-planner.js'),
      import('@reticentrahul/recipe-planner/dist/components/recipe-demo.js'),
    ]);

    // Register each component
    componentModules.forEach((module) => {
      if (module.defineCustomElement) {
        module.defineCustomElement();
      }
    });

    console.log('✓ Stencil components initialized successfully');
  } catch (error) {
    console.error('✗ Failed to initialize Stencil components:', error);
    throw error;
  }
};



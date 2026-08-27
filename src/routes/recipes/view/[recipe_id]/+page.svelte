<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { fetchCategoryOptions, fetchRecipes, type Recipe } from '$lib/api';

  let recipe: Recipe | null = null;
  let categoryOptions: Array<{ id: string; name: string; parent_id: string | null }> = [];
  let loading = true;
  let error = '';

  function getDisplayName(value: any, fallback = 'General') {
    if (!value) return fallback;
    if (typeof value === 'string') return value || fallback;
    return value.name || value.id || fallback;
  }

  async function loadRecipe() {
    loading = true;
    error = '';

    try {
      categoryOptions = await fetchCategoryOptions();
      const recipeId = $page.params.recipe_id;
      const recipes = await fetchRecipes();
      recipe = recipes.find((item) => item.id === recipeId) ?? null;

      if (!recipe) {
        error = 'Recipe not found.';
      }
    } catch (e) {
      console.error('[RecipeViewPage] load error:', e);
      error = 'Unable to load recipe.';
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadRecipe();
  });

  $: if ($page.params.recipe_id) {
    loadRecipe();
  }
</script>

<section class="page">
  {#if loading}
    <p class="status">Loading recipe...</p>
  {:else if error}
    <div class="error-box">
      <p>{error}</p>
      <a href="/">Back to recipes</a>
    </div>
  {:else if recipe}
    <article class="recipe-detail">
      <div class="hero">
        <img src={recipe.image || 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80'} alt={recipe.title} />
      </div>

      <div class="content">
        <div class="header-row">
          <div>
            <p class="eyebrow">{getDisplayName(recipe.category, 'General')} / {getDisplayName(recipe.subcategory, 'General')}</p>
            <h1>{recipe.title}</h1>
          </div>
          <a href="/" class="back-link">Back</a>
        </div>

        <div class="section">
          <h2>Description</h2>
          <p>{recipe.description || 'No description provided.'}</p>
        </div>

        <div class="section">
          <h2>Ingredients</h2>
          <ul>
            {#each recipe.ingredients || [] as ingredient}
              <li>{ingredient}</li>
            {/each}
          </ul>
        </div>

        <div class="section">
          <h2>Steps</h2>
          <ol>
            {#each recipe.steps || [] as step}
              <li>{step}</li>
            {/each}
          </ol>
        </div>
      </div>
    </article>
  {/if}
</section>

<style>
  .page {
    max-width: 1100px;
    margin: 0 auto;
    padding: 32px 20px 80px;
  }

  .status {
    text-align: center;
    color: #4b5563;
  }

  .error-box {
    background: #fff1f2;
    border: 1px solid #fecdd3;
    border-radius: 12px;
    padding: 20px;
    color: #9f1239;
  }

  .error-box a {
    color: #9f1239;
    font-weight: 700;
  }

  .recipe-detail {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 18px;
    overflow: hidden;
    box-shadow: 0 14px 30px rgba(15, 23, 42, 0.07);
  }

  .hero img {
    display: block;
    width: 100%;
    height: 340px;
    object-fit: cover;
    background: #f3f4f6;
  }

  .content {
    padding: 24px;
  }

  .header-row {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: flex-start;
  }

  .eyebrow {
    margin: 0 0 8px;
    color: #f59e0b;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.75rem;
  }

  h1 {
    margin: 0;
    font-size: clamp(2rem, 4vw, 3rem);
    color: #111827;
  }

  .section {
    margin-top: 24px;
  }

  .section h2 {
    margin: 0 0 12px;
    font-size: 1.25rem;
    color: #111827;
  }

  .section p,
  .section li {
    color: #374151;
    line-height: 1.7;
  }

  ul,
  ol {
    margin: 0;
    padding-left: 1.2rem;
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.7rem 1rem;
    background: #111827;
    color: #fff;
    border-radius: 10px;
    text-decoration: none;
    font-weight: 600;
  }
</style>

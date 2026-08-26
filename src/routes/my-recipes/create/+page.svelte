<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { createRecipe, fetchCategoryOptions, type Recipe } from '$lib/api';

  let recipeFormEl: (HTMLElement & { recipe?: Recipe; categories?: Array<{ id: string; name: string; parent_id: string | null }> }) | null = null;
  let categoryOptions: Array<{ id: string; name: string; parent_id: string | null }> = [];

  const handleSave = async (event: Event) => {
    const data = (event as CustomEvent<any>).detail;
    if (!data) return;

    try {
      const created = await createRecipe({ ...data, createdBy: 'user', createdAt: new Date() });
      goto(`/my-recipes?edit=${created.id}`);
    } catch (e) {
      console.error('[MyRecipesCreatePage] save error:', e);
    }
  };

  onMount(async () => {
    categoryOptions = await fetchCategoryOptions();
  });

  $: if (recipeFormEl) {
    recipeFormEl.categories = categoryOptions;
  }
</script>

<section class="route-page">
  <div class="page-header">
    <h1>Create Recipe</h1>
    <a href="/my-recipes" class="back-link">Back to recipes</a>
  </div>

  <div class="form-panel">
    <recipe-form bind:this={recipeFormEl} on:save={handleSave} categories={categoryOptions}></recipe-form>
  </div>
</section>

<style>
  .route-page {
    max-width: 1100px;
    margin: 0 auto;
    padding: 2rem 0;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  h1 {
    margin: 0;
    font-size: 2rem;
  }

  .back-link {
    color: #111827;
    text-decoration: none;
    background: #e5e7eb;
    border-radius: 8px;
    padding: 0.7rem 0.9rem;
    font-weight: 600;
  }

  .form-panel {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 1rem;
  }
</style>

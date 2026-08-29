<script lang="ts">
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { fetchRecipes, updateRecipe, fetchCategoryOptions, type Recipe } from '$lib/api';
  import { showToast } from '$lib/helpers/utils';

  let recipeFormEl = $state<any>(null);
  let loading = $state(true);
  let error = $state('');
  let recipe = $state<Recipe | null>(null);
  let categoryOptions = $state<Array<{ id: string; name: string; parent_id: string | null }>>([]);

  async function load() {
    loading = true;
    try {
      const id = page.params.id;
      const recipes = await fetchRecipes();
      recipe = recipes.find(r => r.id === id) ?? null;
      categoryOptions = await fetchCategoryOptions();
      if (!recipe) error = 'Recipe not found';
    } catch (e) {
      console.error(e);
      error = 'Failed to load recipe';
    } finally {
      loading = false;
    }
  }

  onMount(() => load());

  async function handleSave(e: Event) {
    const payload = (e as CustomEvent<any>).detail;
    if (!payload) return;

    if (payload.subcategory_id === 'all' || payload.subcategory_id === '') {
      payload.subcategory_id = null;
    }
    try {
      await updateRecipe(payload.id, payload);
      showToast('Recipe updated successfully!', 'success');
      goto('/my-recipes');
    } catch (err) {
      console.error('Update error', err);
      showToast('Failed to update recipe.', 'error');
    }
  }
</script>

{#if loading}
  <p>Loading...</p>
{:else if error}
  <p>{error}</p>
{:else}
  <section class="page">
    <h1>Edit Recipe</h1>
    <recipe-form bind:this={recipeFormEl} recipe={recipe} onsave={handleSave} categories={categoryOptions}></recipe-form>
  </section>
{/if}

<style>
  .page { max-width:1100px;margin:0 auto;padding:24px }
</style>

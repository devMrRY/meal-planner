<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { fetchRecipes, updateRecipe, fetchCategoryOptions, type Recipe } from '$lib/api';

  let recipeFormEl: any = null;
  let loading = true;
  let error = '';
  let recipe: Recipe | null = null;
  let categoryOptions: Array<{ id: string; name: string; parent_id: string | null }> = [];

  async function load() {
    loading = true;
    try {
      const id = $page.params.id;
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

    try {
      await updateRecipe(payload.id, payload);
      goto('/my-recipes');
    } catch (err) {
      console.error('Update error', err);
      alert('Failed to update recipe');
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
    <recipe-form bind:this={recipeFormEl} recipe={recipe} on:save={handleSave} categories={categoryOptions}></recipe-form>
  </section>
{/if}

<style>
  .page { max-width:1100px;margin:0 auto;padding:24px }
</style>

<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { deleteRecipe, fetchCategoryOptions, fetchFavorites, fetchUserRecipes, toggleFavorite, type Recipe } from '$lib/api';

  let userId = '';
  let selectedRecipe: Recipe | null = null;
  let userRecipes: Recipe[] = [];
  let favoriteIds: string[] = [];
  let categoryOptions: Array<{ id: string; name: string; parent_id: string | null }> = [];
  let recipeListEl: any = null;

  function genUserId() {
    // const existing = localStorage.getItem('rp_user');
    // if (existing) return existing;

    // const id = 'user_' + Math.random().toString(36).slice(2, 9);
    // localStorage.setItem('rp_user', id);
    return 'user';
  }

  async function reloadUserRecipes() {
    if (!userId) return;

    const recipes = await fetchUserRecipes(userId);
    userRecipes = recipes;

    if (!selectedRecipe && recipes.length) {
      selectedRecipe = recipes[0];
    }

    if (selectedRecipe && !recipes.some((recipe) => recipe.id === selectedRecipe?.id)) {
      selectedRecipe = recipes[0] ?? null;
    }
  }

  const handleDelete = async (recipeId: string) => {
    if (!recipeId) return;

    try {
      await deleteRecipe(recipeId);
      if (selectedRecipe?.id === recipeId) {
        selectedRecipe = null;
      }
      await reloadUserRecipes();
    } catch (e) {
      console.error('[MyRecipesPage] delete error:', e);
    }
  };

  const handleEdit = (recipeId: string) => {
    goto(`/my-recipes/edit/${recipeId}`);
  };

  const handleOpen = (event: Event) => {
    const id = (event as CustomEvent<string>).detail;
    if (!id) return;
    goto(`/recipes/view/${id}`);
  };

  const handleFavorite = async (event: Event) => {
    const id = (event as CustomEvent<string>).detail;
    if (!id) return;
    try {
      await toggleFavorite(userId, id);

      const nextFavorites = new Set(favoriteIds);
      if (nextFavorites.has(id)) {
        nextFavorites.delete(id);
      } else {
        nextFavorites.add(id);
      }

      favoriteIds = [...nextFavorites];
      await reloadUserRecipes();
    } catch (e) {
      console.error('[MyRecipesPage] favorite error:', e);
    }
  };

  const handleRecipeEdit = (event: Event) => {
    handleEdit((event as CustomEvent<string>).detail);
  };

  const handleRecipeDelete = (event: Event) => {
    handleDelete((event as CustomEvent<string>).detail);
  };

  const handleNew = () => {
    goto('/my-recipes/create');
  };

  onMount(async () => {
    userId = genUserId();
    categoryOptions = await fetchCategoryOptions();
    favoriteIds = await fetchFavorites(userId);
    await reloadUserRecipes();
    console.log('[MyRecipesPage] userId =', userId);
  });

  // No embedded form on this page: creation/editing handled on separate routes
  function setRecipeListProps(el: any) {
    try {
      el.recipes = userRecipes;
      el.layout = 'grid';
      el.favoriteIds = favoriteIds;
    } catch (err) {
      // ignore runtime assignment errors
    }
  }

  $: if (recipeListEl && userRecipes.length) setRecipeListProps(recipeListEl);

  $: console.log(recipeListEl, userRecipes);
</script>

<section class="route-page">
  <div class="page-header">
    <h1>My Recipes</h1>
    <button type="button" class="new-button" on:click={handleNew}>
      + New recipe
    </button>
  </div>

  <div class="layout">
    <recipe-list
      bind:this={recipeListEl}
      layout="grid"
      on:open={handleOpen}
      on:favorite={handleFavorite}
      on:edit={handleRecipeEdit}
      on:delete={handleRecipeDelete}
    ></recipe-list>
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
    margin-bottom: 1.25rem;
  }

  h1 {
    margin: 0;
    font-size: 2rem;
  }

  .new-button {
    border: none;
    border-radius: 8px;
    padding: 0.65rem 0.9rem;
    font: inherit;
    cursor: pointer;
    background: #111827;
    color: #fff;
  }

  .layout {
    display: grid;
    grid-template-columns: minmax(0, 1.7fr) minmax(260px, 0.9fr);
    gap: 1.25rem;
  }

  @media (max-width: 800px) {
    .layout {
      grid-template-columns: 1fr;
    }
  }
</style>
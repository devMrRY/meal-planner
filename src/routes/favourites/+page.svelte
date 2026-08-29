<script lang="ts">
  import { onMount } from "svelte";
  import { fetchFavorites, toggleFavorite, type Recipe } from "$lib/api";
  import { getUserId } from "$lib/helpers/utils";

  let userId = $state("");
  let selectedRecipe = $state<Recipe | null>(null);
  let userRecipes = $state<Recipe[]>([]);
  let favoriteIds = $state<string[]>([]);
  let recipeListEl = $state<any>(null);

  const handleFavorite = async (event: Event) => {
    const id = (event as CustomEvent<string>).detail;
    if (!id) return;
    const isFavorite = favoriteIds.includes(id);
    try {
      await toggleFavorite(userId, id, isFavorite);

      const nextFavorites = new Set(favoriteIds);
      if (nextFavorites.has(id)) {
        nextFavorites.delete(id);
      } else {
        nextFavorites.add(id);
      }

      favoriteIds = [...nextFavorites];
      // await reloadUserRecipes();
    } catch (e) {
      console.error("[MyRecipesPage] favorite error:", e);
    }
  };

  async function loadFavorites() {
    if (!userId) return;

    const favoriteRecipes = await fetchFavorites(userId);
    favoriteIds = favoriteRecipes.map((r) => r.id);
    userRecipes = favoriteRecipes;

    if (!selectedRecipe && favoriteRecipes.length) {
      selectedRecipe = favoriteRecipes[0];
    }

    if (
      selectedRecipe &&
      !favoriteRecipes.some((recipe) => recipe.id === selectedRecipe?.id)
    ) {
      selectedRecipe = favoriteRecipes[0] ?? null;
    }
  }

  onMount(async () => {
    userId = getUserId();
    loadFavorites();
  });

  function setRecipeListProps(el: any) {
    try {
      el.recipes = userRecipes;
      el.layout = "grid";
      el.favoriteIds = favoriteIds;
    } catch (err) {
      // ignore runtime assignment errors
    }
  }

  $effect(() => {
    if (recipeListEl && userRecipes.length) {
      setRecipeListProps(recipeListEl);
    }
  });
</script>

<section class="route-page">
  <div class="page-header">
    <h1>Favourites</h1>
    <p>Your saved favourite recipes will appear here.</p>
  </div>

  <div class="layout">
    <recipe-list
      bind:this={recipeListEl}
      layout="grid"
      hide-actions={true}
      onfavorite={handleFavorite}
    ></recipe-list>
  </div>
</section>

<style>
  .route-page {
    max-width: 1100px;
    margin: 0 auto;
    padding: 2rem 0;
  }

  .page-header > h1 {
    margin-bottom: 0.75rem;
    font-size: 2rem;
  }

  .page-header p {
    color: #4b5563;
    font-size: 1rem;
  }

  h1 {
    margin: 0;
    font-size: 2rem;
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

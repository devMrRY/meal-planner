<script lang="ts">
  import { onMount } from "svelte";
  import { fetchFavorites, toggleFavorite, type Recipe } from "$lib/api";
  import { getUserId, showToast } from "$lib/helpers/utils";
  import { EmptyRecipe } from "$lib/components";

  let userId = $state("");
  let selectedRecipe = $state<Recipe | null>(null);
  let userRecipes = $state<Recipe[]>([]);
  let favoriteIds = $state<string[]>([]);
  let recipeListEl = $state<any>(null);
  let isLoadingMore = $state(false);
  let isLoading = $state(false);

  const handleFavorite = async (event: Event) => {
    const id = (event as CustomEvent<string>).detail;
    if (!id) return;
    const isFavorite = favoriteIds.includes(id);
    try {
      await toggleFavorite(userId, id, isFavorite);
      userRecipes = userRecipes.filter((recipe) => recipe.id !== id);
      const nextFavorites = new Set(favoriteIds);
      if (nextFavorites.has(id)) {
        nextFavorites.delete(id);
      } else {
        nextFavorites.add(id);
      }

      favoriteIds = [...nextFavorites];
      showToast(
        isFavorite
          ? "Recipe removed from favorites."
          : "Recipe added to favorites.",
        "success",
      );
    } catch (e) {
      console.error("[MyRecipesPage] favorite error:", e);
      showToast(
        isFavorite
          ? "Failed to remove recipe from favorites."
          : "Failed to add recipe to favorites.",
        "error",
      );
    }
  };

  async function loadFavorites() {
    if (!userId) return;
    isLoading = true;
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
    isLoading = false;
  }

  const handleLoadMore = async () => {
    isLoadingMore = true;
    const newRecipes = await fetchFavorites(
      userId,
      Math.floor(userRecipes.length / 10) + 1,
    );
    userRecipes = [...userRecipes, ...newRecipes];
    isLoadingMore = false;
  };

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
      console.error("[FavouritesPage] setRecipeListProps error:", err);
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
    {#if isLoading}
      <p class="loading">Loading favourite recipes...</p>
    {:else if userRecipes.length === 0}
      <EmptyRecipe
        title="No favourites yet"
        description="You haven't added any recipes to your favourites yet. Start exploring and add your favourite recipes to this list."
      ></EmptyRecipe>
    {:else}
      <recipe-list
        bind:this={recipeListEl}
        layout="grid"
        hide-actions={true}
        onfavorite={handleFavorite}
      ></recipe-list>
      <div class="load-more-container">
        <button onclick={handleLoadMore} disabled={isLoadingMore}>
          {isLoadingMore ? "Loading..." : "Load More"}
        </button>
      </div>
    {/if}
  </div>
</section>

<style>
  .route-page {
    max-width: 1100px;
    margin: 0 auto;
    padding: 2rem 0;
  }

  .loading {
    text-align: center;
    font-size: 1.2rem;
    color: #4b5563;
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
    width: 100%;
  }

  .load-more-container {
    display: flex;
    justify-content: center;
    text-align: center;
    margin-top: 1.5rem;
  }

  .load-more-container button {
    padding: 0.7rem 1.2rem;
    font-size: 1rem;
    border: none;
    border-radius: 8px;
    background: #f59e0b;
    color: #fff;
    cursor: pointer;
  }

  .load-more-container button:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }

  .load-more-container button:hover:not(:disabled) {
    background: #d97706;
  }
</style>

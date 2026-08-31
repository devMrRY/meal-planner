<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import {
    deleteRecipe,
    fetchFavorites,
    fetchRecipes,
    toggleFavorite,
    type Recipe,
  } from "$lib/api";
  import { findRecipeTitle, getUserId, showToast } from "$lib/helpers/utils";
  import { EmptyRecipe } from "$lib/components";
  import ConfirmDeleteModal from "$lib/components/ConfirmModal.svelte";
  import CategoryModal from "$lib/components/CategoryModal.svelte";

  let userId = $state("");
  let isLoadingMore = $state(false);
  let selectedRecipe = $state<Recipe | null>(null);
  let userRecipes = $state<Recipe[]>([]);
  let favoriteIds = $state<string[]>([]);
  let recipeListEl = $state<any>(null);
  let isLoading = $state(false);
  let currentPage = $state(1);
  let hasMore = $state(true);
  let recipeToDelete = $state<string | null>(null);
  let openCategoryModal = $state(false);

  const pageSize = 10;

  function cancelDelete() {
    recipeToDelete = null;
  }

  async function confirmDelete() {
    if (!recipeToDelete) return;

    const id = recipeToDelete;
    try {
      await deleteRecipe(id, userId);
      const isFavorite = favoriteIds.includes(id);
      if (isFavorite) {
        await toggleFavorite(userId, id, true);
        favoriteIds = favoriteIds.filter((favoriteId) => favoriteId !== id);
      }
      if (selectedRecipe?.id === id) {
        selectedRecipe = null;
      }
      userRecipes = userRecipes.filter((recipe) => recipe.id !== id);
      recipeToDelete = null;
      showToast("Recipe deleted successfully.", "success");
    } catch (e) {
      showToast("Failed to delete recipe.", "error");
    }
  }

  async function reloadUserRecipes() {
    if (!userId) return;

    try {
      const { recipes } = await fetchRecipes(
        null,
        null,
        null,
        userId,
        1,
        pageSize,
      );
      currentPage = 1;
      hasMore = recipes.length === pageSize;
      userRecipes = recipes;

      if (!selectedRecipe && recipes.length) {
        selectedRecipe = recipes[0];
      }

      if (
        selectedRecipe &&
        !recipes.some((recipe) => recipe.id === selectedRecipe?.id)
      ) {
        selectedRecipe = recipes[0] ?? null;
      }
    } catch (e) {
      showToast("Failed to load your recipes.", "error");
      userRecipes = [];
      selectedRecipe = null;
      hasMore = false;
    }
  }

  const handleDelete = async (recipeId: string) => {
    if (!recipeId) return;
    recipeToDelete = recipeId;
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
      showToast(
        isFavorite
          ? "Recipe removed from favorites."
          : "Recipe added to favorites.",
        "success",
      );
    } catch (e) {
      showToast("Failed to update favorites.", "error");
    }
  };

  const handleRecipeEdit = (event: Event) => {
    handleEdit((event as CustomEvent<string>).detail);
  };

  const handleRecipeDelete = (event: Event) => {
    handleDelete((event as CustomEvent<string>).detail);
  };

  const handleNew = () => {
    goto("/my-recipes/create");
  };

  const handleNewCategory = () => {
    openCategoryModal = true;
  };

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;

    isLoadingMore = true;
    try {
      const nextPage = currentPage + 1;
      const { recipes: newRecipes } = await fetchRecipes(
        null,
        null,
        null,
        userId,
        nextPage,
        pageSize,
      );

      if (newRecipes.length === 0) {
        hasMore = false;
        return;
      }

      userRecipes = [...userRecipes, ...newRecipes];
      currentPage = nextPage;
      hasMore = newRecipes.length === pageSize;
    } catch (e) {
      showToast("Failed to load more recipes.", "error");
    } finally {
      isLoadingMore = false;
    }
  };

  onMount(async () => {
    isLoading = true;
    try {
      userId = getUserId();
      const favouriteRecipes = await fetchFavorites(userId);
      favoriteIds = favouriteRecipes.map((r) => r.id);
      await reloadUserRecipes();
    } catch (e) {
      showToast("Failed to load your recipes.", "error");
    } finally {
      isLoading = false;
    }
  });

  function setRecipeListProps(el: any) {
    try {
      el.recipes = userRecipes.map((recipe) => ({
        ...recipe,
        isOwner: true,
      }));
      el.layout = "grid";
      el.favoriteIds = favoriteIds;
    } catch (err) {
      console.error("[MyRecipesPage] setRecipeListProps error:", err);
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
    <h1>My Recipes</h1>
    <div class="button-group">
      <button type="button" class="new-button" onclick={handleNewCategory}>
        + New Category
      </button>
      <button type="button" class="new-button" onclick={handleNew}>
        + New recipe
      </button>
    </div>
  </div>

  <div class="layout">
    {#if isLoading}
      <p class="loading">Loading recipes...</p>
    {:else if userRecipes.length === 0}
      <EmptyRecipe
        title="No recipes yet"
        description="You haven't created any recipes yet. Start building your collection by adding your first recipe."
      >
        <button type="button" class="create-button" onclick={handleNew}>
          + Create your first recipe
        </button>
      </EmptyRecipe>
    {:else}
      <recipe-list
        bind:this={recipeListEl}
        layout="grid"
        onopen={handleOpen}
        onfavorite={handleFavorite}
        onedit={handleRecipeEdit}
        ondelete={handleRecipeDelete}
      ></recipe-list>
      {#if hasMore}
        <div class="load-more-container">
          <button onclick={handleLoadMore} disabled={isLoadingMore}>
            {isLoadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      {/if}
    {/if}
  </div>

  <CategoryModal
    open={openCategoryModal}
    onCancel={() => (openCategoryModal = false)}
    onConfirm={() => {
      openCategoryModal = false;
    }}
  ></CategoryModal>

  <ConfirmDeleteModal
    open={recipeToDelete !== null}
    onConfirm={confirmDelete}
    onCancel={cancelDelete}
  >
    <p>
      Are you sure you want to delete
      <strong>{findRecipeTitle(userRecipes, recipeToDelete)}</strong>?
    </p>
  </ConfirmDeleteModal>
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

  .loading {
    text-align: center;
    font-size: 1.1rem;
    color: #6b7280;
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
    background: #f59e0b;
    color: #fff;
  }

  .new-button:hover {
    background: #d97706;
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

  .create-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;

    padding: 10px 18px;

    border: none;
    border-radius: 9px;

    background: #f59e0b;
    color: #ffffff;

    font: inherit;
    font-size: 0.9rem;
    font-weight: 600;

    cursor: pointer;

    box-shadow: 0 4px 10px rgba(245, 158, 11, 0.2);

    transition:
      background 0.15s ease,
      transform 0.15s ease,
      box-shadow 0.15s ease;
  }

  .create-button:hover {
    background: #d97706;
    transform: translateY(-1px);
    box-shadow: 0 6px 14px rgba(245, 158, 11, 0.25);
  }

  .create-button:active {
    transform: translateY(0);
  }

  .create-button:focus-visible {
    outline: 2px solid #f59e0b;
    outline-offset: 3px;
  }
</style>

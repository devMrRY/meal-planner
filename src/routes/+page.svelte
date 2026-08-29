<script lang="ts">
  import { onMount } from "svelte";
  import {
    fetchRecipes,
    fetchFavorites,
    toggleFavorite,
    fetchCategoryOptions,
    deleteRecipe,
    type Recipe,
  } from "$lib/api";
  import { goto } from "$app/navigation";
  import { getUserId, showToast } from "$lib/helpers/utils";

  let recipes = $state<Recipe[]>([]);
  let selectedRecipe = $state<Recipe | null>(null);
  let favorites = $state<Set<string>>(new Set());

  let isLoading = $state(true);
  let isLoadingMore = $state(false);
  let error = $state("");
  let userId = $state("");

  let searchTimeout: ReturnType<typeof setTimeout>;

  let searchTerm = $state("");
  let selectedCategory = $state("all");
  let selectedSubcategory = $state("all");
  let categoryOptions = $state<
    Array<{ id: string; name: string; parent_id: string | null }>
  >([]);

  let recipeListEl = $state<any>(null);
  let recipeDetailEl = $state<any>(null);
  const subcategoryDisabled = $derived(!selectedCategory);

  function handleSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      loadRecipes();
    }, 300);
  }

  const categoryList = $derived.by(() => [
    { id: "all", name: "All categories" },
    ...Array.from(
      new Set(
        categoryOptions.length
          ? categoryOptions.filter((item) => !item.parent_id)
          : [],
      ),
    ),
  ]);

  const selectedCategoryRow = $derived.by(() =>
    selectedCategory === "all"
      ? null
      : (categoryOptions.find((item) => item.id === selectedCategory) ?? null),
  );

  const filteredSubcategories = $derived.by(() => [
    { id: "all", name: "All subcategories" },
    ...Array.from(
      new Set(
        categoryOptions.length
          ? selectedCategory === "all"
            ? categoryOptions.filter((item) => item.parent_id)
            : categoryOptions.filter(
                (item) => item.parent_id === selectedCategoryRow?.id,
              )
          : [],
      ),
    ),
  ]);

  $effect(() => {
    if (selectedCategoryRow) {
      loadRecipes();
    }
  });

  $effect(() => {
    if (!recipeListEl) return;
    recipeListEl.recipes = recipes.map((r) => ({
      ...r,
      isOwner: r.createdBy === userId,
    }));
    recipeListEl.layout = "grid";
    recipeListEl.favoriteIds = [...favorites];
  });

  $effect(() => {
    if (recipeDetailEl) {
      recipeDetailEl.recipe = selectedRecipe ?? undefined;
    }
  });

  $effect(() => {
    if (recipes.length) {
      const selectedId = selectedRecipe?.id ?? null;

      if (!selectedId || !recipes.some((r) => r.id === selectedId)) {
        selectedRecipe = recipes[0];
      }
    } else {
      selectedRecipe = null;
    }
  });

  const handleOpen = (event: Event) => {
    const id = (event as CustomEvent<string>).detail;
    const match = recipes.find((r) => r.id === id);

    if (match) {
      selectedRecipe = match;
    }
  };

  const handleFavorite = async (event: Event) => {
    const id = (event as CustomEvent<string>).detail;
    const isFavorite = favorites.has(id);
    try {
      await toggleFavorite(userId, id, isFavorite);

      const nextFavorites = new Set(favorites);
      if (nextFavorites.has(id)) {
        nextFavorites.delete(id);
      } else {
        nextFavorites.add(id);
      }

      favorites = nextFavorites;
      showToast(`${isFavorite ? "Removed from" : "Added to"} favorites`, "success");
    } catch (e) {
      showToast(`Failed to ${isFavorite ? "remove from" : "add to"} favorites`, "error");
    }
  };

  const handleEdit = (event: Event) => {
    const id = (event as CustomEvent<string>).detail;
    if (!id) return;
    goto(`/my-recipes/edit/${id}`);
  };

  const handleDelete = async (event: Event) => {
    const id = (event as CustomEvent<string>).detail;
    if (!id) return;

    try {
      await deleteRecipe(id);
      const isFavorite = favorites.has(id);
      if (isFavorite) {
        await toggleFavorite(userId, id, true); // Remove from favorites if it was a favorite
        const nextFavorites = new Set(favorites);
        nextFavorites.delete(id);
        favorites = nextFavorites;
      }
      loadRecipes();
      showToast("Recipe deleted successfully!", "success");
    } catch (e) {
      console.error("[Page] Delete error:", e);
      showToast("Failed to delete recipe.", "error");
    }
  };

  async function loadAll() {
    try {
      isLoading = true;
      error = "";
      loadRecipes();
      loadFavorites();
      loadCategories();
    } catch (e) {
      console.error("[Page] loadAll() error:", e);
      showToast("Failed to load application data.", "error");
      error =
        e instanceof Error ? e.message : "Failed to load application data";
    } finally {
      isLoading = false;
    }
  }

  async function loadRecipes() {
    recipes = await fetchRecipes(
      searchTerm,
      selectedCategory,
      selectedSubcategory,
    );
    if (recipes.length) {
      selectedRecipe = recipes[0];
    }
  }

  async function loadFavorites() {
    const favs = await fetchFavorites(userId);
    favorites = new Set(favs.map((r) => r.id));
  }

  async function loadCategories() {
    const fetchedCategories = await fetchCategoryOptions();
    categoryOptions = fetchedCategories;
  }

  const handleLoadMore = async () => {
    isLoadingMore = true;
    const newRecipes = await fetchRecipes(
      searchTerm,
      selectedCategory,
      selectedSubcategory,
      Math.floor(recipes.length/10) + 1,
    );
    recipes = [...recipes, ...newRecipes];
    isLoadingMore = false;
  }

  onMount(() => {
    userId = getUserId();
    loadAll();
  });
</script>

<svelte:head>
  <title>Recipe Planner Consumer</title>
</svelte:head>

<section class="page">
  <h1>Recipe Planner</h1>

  {#if isLoading}
    <p class="loading">Loading recipes...</p>
  {:else if error}
    <div class="error-box">
      <p>
        <strong>❌ Error:</strong>
        {error}
      </p>

      <p>
        <strong>Troubleshooting:</strong>
      </p>

      <ul>
        <li>Open browser DevTools (F12) and check the Console tab</li>
        <li>Verify Supabase tables exist</li>
        <li>Check Supabase RLS policies</li>
        <li>Ensure Supabase credentials are correct</li>
      </ul>
    </div>
  {:else}
    <div class="filters">
      <label>
        <span>Search recipes</span>
        <input
          name="search-recipes"
          bind:value={searchTerm}
          oninput={handleSearch}
          type="search"
          placeholder="Search recipes"
        />
      </label>

      <label>
        <span>Category</span>
        <select
          bind:value={selectedCategory}
          onchange={() => (selectedSubcategory = "all")}
        >
          {#each categoryList as category}
            <option value={category.id}>{category.name}</option>
          {/each}
        </select>
      </label>

      <label>
        <span>Subcategory</span>
        <select bind:value={selectedSubcategory} disabled={subcategoryDisabled}>
          {#each filteredSubcategories as subcategory}
            <option value={subcategory.id}>{subcategory.name}</option>
          {/each}
        </select>
      </label>
    </div>

    <recipe-list
      bind:this={recipeListEl}
      layout="grid"
      onopen={handleOpen}
      onfavorite={handleFavorite}
      onedit={handleEdit}
      ondelete={handleDelete}
    ></recipe-list>
    <div class="load-more-container">
      <button onclick={handleLoadMore} disabled={isLoadingMore}>
        {isLoadingMore ? "Loading..." : "Load More"}
      </button>
    </div>
  {/if}
</section>

<style>
  .page {
    max-width: 1100px;
    margin: 0 auto;
    padding: 32px 20px 80px;
    color: #1f2937;
  }

  .filters {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
    margin: 1rem 0 1.5rem;
    padding: 1rem;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
  }

  .filters label {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    font-weight: 600;
    color: #374151;
  }

  .filters input,
  .filters select {
    width: 100%;
    padding: 0.7rem 0.8rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 0.95rem;
    background: #fff;
  }

  .filters select:disabled {
    background: #f3f4f6;
    cursor: not-allowed;
    opacity: 0.7;
  }

  .loading {
    padding: 20px;
    text-align: center;
    color: #6b7280;
  }

  .error-box {
    background: #fee2e2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    padding: 16px;
    margin: 16px 0;
    color: #991b1b;
  }

  .error-box p {
    margin: 8px 0;
  }

  .error-box ul {
    margin: 8px 0 8px 20px;
    padding: 0;
  }

  .error-box li {
    margin: 4px 0;
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

  @media (max-width: 600px) {
    .filters {
      grid-template-columns: 1fr;
    }
  }
</style>

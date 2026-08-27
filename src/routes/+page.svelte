<script lang="ts">
  import { onMount } from "svelte";
  import {
    fetchRecipes,
    fetchFavorites,
    toggleFavorite,
    fetchMealPlan,
    fetchCategoryOptions,
    deleteRecipe,
    type Recipe,
  } from "$lib/api";
  import { goto } from '$app/navigation';

  let recipes = $state<Recipe[]>([]);
  let selectedRecipe = $state<Recipe | null>(null);
  let favorites = $state<Set<string>>(new Set());
  let mealPlan = $state<any>(null);

  let isLoading = $state(true);
  let error = $state("");
  let userId = $state("");

  let searchTerm = $state("");
  let selectedCategory = $state("all");
  let selectedSubcategory = $state("all");
  let categoryOptions = $state<Array<{ id: string; name: string; parent_id: string | null }>>([]);

  let recipeListEl = $state<any>(null);
  let recipeDetailEl = $state<any>(null);

  function categoryIdOf(value: any): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') return String(value.id ?? value.category_id ?? '').trim();
    return String(value).trim();
  }

  function categoryNameOf(value: any): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') return String(value.name ?? value.category_name ?? value.id ?? '').trim();
    return String(value).trim();
  }

  const categoryList = $derived.by(() => [
    { id: "all", name: "All categories" },
    ...Array.from(
      new Set(
        categoryOptions.length
          ? categoryOptions
              .filter((item) => !item.parent_id)
              .map((item) => JSON.stringify({ id: item.id, name: item.name }))
          : recipes.map((r) => JSON.stringify({ id: categoryIdOf(r.category), name: categoryNameOf(r.category) })).filter(Boolean)
      )
    )
      .map((value) => JSON.parse(value))
      .filter((item) => item.id || item.name)
  ]);

  const selectedCategoryRow = $derived.by(() =>
    selectedCategory === "all"
      ? null
      : categoryOptions.find((item) => item.id === selectedCategory) ?? null
  );

  const selectedSubcategoryRow = $derived.by(() =>
    selectedSubcategory === "all"
      ? null
      : categoryOptions.find((item) => item.id === selectedSubcategory) ?? null
  );

  const filteredSubcategories = $derived.by(() =>
    selectedCategory === "all"
      ? [
          { id: "all", name: "All subcategories" },
          ...Array.from(
            new Set(
              categoryOptions.length
                ? categoryOptions
                    .filter((item) => item.parent_id)
                    .map((item) => JSON.stringify({ id: item.id, name: item.name }))
                : recipes.map((r) => JSON.stringify({ id: categoryIdOf(r.subcategory), name: categoryNameOf(r.subcategory) })).filter(Boolean)
            )
          )
            .map((value) => JSON.parse(value))
            .filter((item) => item.id || item.name)
        ]
      : [
          { id: "all", name: "All subcategories" },
          ...Array.from(
            new Set(
              categoryOptions.length
                ? categoryOptions
                    .filter((item) => item.parent_id === selectedCategoryRow?.id)
                    .map((item) => JSON.stringify({ id: item.id, name: item.name }))
                : recipes
                    .filter((r) => categoryIdOf(r.category) === selectedCategory || (selectedCategoryRow && categoryNameOf(r.category) === selectedCategoryRow.name))
                    .map((r) => JSON.stringify({ id: categoryIdOf(r.subcategory), name: categoryNameOf(r.subcategory) }))
                    .filter(Boolean)
            )
          )
            .map((value) => JSON.parse(value))
            .filter((item) => item.id || item.name)
        ]
  );

  const subcategoryDisabled = $derived(selectedCategory === "all");

  const filteredRecipes = $derived.by(() =>
    recipes.filter((recipe) => {
      const matchesCategory =
        selectedCategory === "all" ||
        categoryIdOf(recipe.category_id) === selectedCategory ||
        (selectedCategoryRow && categoryNameOf(recipe.category?.name) === selectedCategoryRow.name);

      const matchesSubcategory =
        selectedSubcategory === "all" ||
        categoryIdOf(recipe.subcategory_id) === selectedSubcategory ||
        (selectedSubcategoryRow && categoryNameOf(recipe.subcategory?.name) === selectedSubcategoryRow.name);

      return matchesCategory && matchesSubcategory;
    })
  );

  $effect(() => {
    if (!recipeListEl) return;
    recipeListEl.recipes = filteredRecipes;
    recipeListEl.layout = "grid";
    recipeListEl.favoriteIds = [...favorites];
  });

  $effect(() => {
    if (recipeDetailEl) {
      recipeDetailEl.recipe = selectedRecipe ?? undefined;
    }
  });

  $effect(() => {
    if (filteredRecipes.length) {
      const selectedId = selectedRecipe?.id ?? null;

      if (!selectedId || !filteredRecipes.some((r) => r.id === selectedId)) {
        selectedRecipe = filteredRecipes[0];
      }
    } else {
      selectedRecipe = null;
    }
  });

  function genUserId() {
    const existing = localStorage.getItem("rp_user");

    if (existing) {
      return existing;
    }

    const id = "user_" + Math.random().toString(36).slice(2, 9);
    localStorage.setItem("rp_user", id);
    return id;
  }

  const handleOpen = (event: Event) => {
    const id = (event as CustomEvent<string>).detail;
    const match = filteredRecipes.find((r) => r.id === id);

    if (match) {
      selectedRecipe = match;
    }
  };

  const handleFavorite = async (event: Event) => {
    const id = (event as CustomEvent<string>).detail;

    try {
      await toggleFavorite(userId, id);

      const nextFavorites = new Set(favorites);
      if (nextFavorites.has(id)) {
        nextFavorites.delete(id);
      } else {
        nextFavorites.add(id);
      }

      favorites = nextFavorites;
      localStorage.setItem("rp_favs", JSON.stringify([...favorites]));
    } catch (e) {
      console.error("[Page] Favorite error:", e);
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
      await loadAll();
    } catch (e) {
      console.error("[Page] Delete error:", e);
    }
  };

  async function loadAll() {
    try {
      isLoading = true;
      error = "";

      const fetchedCategories = await fetchCategoryOptions();
      categoryOptions = fetchedCategories;

      recipes = await fetchRecipes();

      if (recipes.length) {
        selectedRecipe = recipes[0];
      }

      const favs = await fetchFavorites(userId);
      favorites = new Set(favs);

      mealPlan = await fetchMealPlan(userId);
    } catch (e) {
      console.error("[Page] loadAll() error:", e);
      error = e instanceof Error ? e.message : "Failed to load application data";
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    userId = genUserId();
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
    <p>Favorites: {favorites.size}</p>

    <div class="filters">
      <label>
        <span>Search</span>
        <input bind:value={searchTerm} type="search" placeholder="Search recipes" />
      </label>

      <label>
        <span>Category</span>
        <select bind:value={selectedCategory} onchange={() => (selectedSubcategory = "all")}>
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
      onopen={handleOpen}
      onfavorite={handleFavorite}
      onedit={handleEdit}
      ondelete={handleDelete}
    ></recipe-list>
  {/if}
</section>

<style>
  .page {
    max-width: 1100px;
    margin: 0 auto;
    padding: 32px 20px 80px;
    font-family: Arial, sans-serif;
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
</style>

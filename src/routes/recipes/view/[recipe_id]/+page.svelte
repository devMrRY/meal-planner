<script lang="ts">
  import { page } from "$app/state";
  import { onMount } from "svelte";
  import { fetchCategoryOptions, fetchRecipeById, type Recipe } from "$lib/api";
  import { getPlaceholderUrl } from "$lib/helpers/utils";

  let recipe = $state<Recipe | null>(null);
  let categoryOptions = $state<
    Array<{ id: string; name: string; parent_id: string | null }>
  >([]);
  let loading = $state(true);
  let error = $state("");

  function getDisplayName(value: any, fallback = "General") {
    if (!value) return fallback;
    if (typeof value === "string") return value || fallback;
    return value.name || value.id || fallback;
  }

  async function loadRecipe() {
    loading = true;
    error = "";

    try {
      categoryOptions = await fetchCategoryOptions();
      const recipeId = page.params.recipe_id;
      recipe = await fetchRecipeById(recipeId);

      if (!recipe) {
        error = "Recipe not found.";
      }
    } catch (e) {
      console.error("[RecipeViewPage] load error:", e);
      error = "Unable to load recipe.";
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    void loadRecipe();
  });

  $effect(() => {
    if (page.params.recipe_id) {
      void loadRecipe();
    }
  });
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
        <img
          src={recipe.image}
          alt={recipe.title}
          onerror={(event) => {
            const img = event.target as HTMLImageElement;
            img.src =  getPlaceholderUrl();
          }}
        />
      </div>

      <div class="content">
        <div class="header-row">
          <div>
            <p class="eyebrow">
              {getDisplayName(recipe.category, "General")} / {getDisplayName(
                recipe.subcategory,
                "General",
              )}
            </p>
            <h1>{recipe.title}</h1>
          </div>
          <a href="/" class="back-link">Back</a>
        </div>

        <div class="section">
          <h2>Description</h2>
          <p>{recipe.description || "No description provided."}</p>
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
    padding: 20px 20px 40px;
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
    background: #fff;
    text-decoration: none;
    color: #78716c;
    border: 1px solid #fed7aa;
    border-radius: 8px;
    padding: 0.7rem 0.9rem;
    font-weight: 600;
  }

  .back-link:hover {
    box-shadow: 0 2px 4px rgb(15 23 42 / 12%);
  }
</style>

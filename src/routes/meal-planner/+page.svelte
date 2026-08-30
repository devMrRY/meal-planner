<script lang="ts">
  import { onMount } from "svelte";
  import {
    fetchMealPlan,
    saveMealPlan,
    fetchRecipes,
    deleteMealPlan,
    updateMealPlan,
    clearMealPlansForDate,
    clearWeek,
  } from "$lib/api";
  import {
    debounce,
    getCurrentDate,
    getUserId,
    showToast,
  } from "$lib/helpers/utils";
  import ConfirmDeleteModal from "$lib/components/ConfirmModal.svelte";

  interface IRecipe {
    id: string;
    title: string;
    category: string;
    description: string;
    image: string;
  }

  let planner: HTMLElement;
  let userId = $state("");
  let modalOpen = $state(false);
  let searchQuery = $state("");
  let loadingRecipes = $state(false);
  let clearTarget = $state<{ type: "day" | "week"; date?: string } | null>(
    null,
  );
  let deleteTarget = $state<{ id: string; title: string } | null>(null);
  let editingRecipe = $state<{
    id: string;
    date: string;
    mealType: string;
    recipeId: string;
  } | null>(null);
  let pendingMealSlot = $state({
    date: "",
    mealType: "",
  });

  let mealPlans = $state<
    Array<{
      id: string;
      date: string;
      mealType: string;
      recipeId: string;
      recipeName: string;
      category: string;
      imageUrl: string;
    }>
  >([]);

  let availableRecipes = $state<
    Array<{
      id: string;
      title: string;
      category: string;
      description: string;
      image: string;
    }>
  >([]);

  let filteredRecipes = $derived(
    availableRecipes.filter((recipe) => {
      const query = searchQuery.trim().toLowerCase();

      if (!query) return true;

      return (
        recipe.title.toLowerCase().includes(query) ||
        recipe.category.toLowerCase().includes(query) ||
        recipe.description.toLowerCase().includes(query)
      );
    }),
  );

  const handleSearch = debounce(loadRecipes, 300);

  async function loadMealPlan() {
    if (!userId) return;
    const { startDate, endDate } = getWeekDateRange();

    const rows = await fetchMealPlan(userId, startDate, endDate);

    mealPlans = rows.map((entry) => ({
      id: entry.id,
      date: entry.date || "",
      mealType: entry.meal_type || "breakfast",
      recipeId: entry.recipe_id,
      recipeName: entry.recipe?.title || "Saved recipe",
      category: entry.recipe?.category?.name || "",
      imageUrl: entry.recipe?.image || "",
    }));
  }

  async function loadRecipes() {
    loadingRecipes = true;
    try {
      const { recipes } = await fetchRecipes(searchQuery);
      availableRecipes = recipes.map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category?.name || "",
        description: r.description,
        image: r.image || "",
      }));
    } catch (err) {
      console.error("Failed to fetch recipes", err);
    } finally {
      loadingRecipes = false;
    }
  }

  $effect(() => {
    if (modalOpen) {
      loadRecipes();
    }
  });

  onMount(() => {
    userId = getUserId();
    loadMealPlan();
  });

  function formatDayLabel(dateString: string): string {
    if (!dateString) return "Selected day";

    const date = new Date(`${dateString}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return dateString;
    }

    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  }

  function addRecipe(event: CustomEvent) {
    pendingMealSlot = event.detail;
    searchQuery = "";
    modalOpen = true;
  }

  async function addMeal(recipe: IRecipe) {
    if (!userId) return;
    let nextEntry = {
      id: recipe.id,
      date: pendingMealSlot.date,
      mealType: pendingMealSlot.mealType,
      recipeId: recipe.id,
      recipeName: recipe.title,
      category: recipe.category,
      imageUrl: recipe.image || "",
    };
    await saveMealPlan({
      user_id: userId,
      meal_type: nextEntry.mealType,
      recipe_id: nextEntry.recipeId,
      updated_by: userId,
      date: nextEntry.date,
      updated_at: new Date().toISOString(),
    });
    showToast(
      `Added ${recipe.title} for ${formatDayLabel(nextEntry.date)} (${nextEntry.mealType}).`,
      "success",
    );
    mealPlans = mealPlans.filter(
      (meal) =>
        !(meal.date === nextEntry.date && meal.mealType === nextEntry.mealType),
    );

    mealPlans = [...mealPlans, nextEntry];
  }

  async function editMeal(recipe: IRecipe) {
    if (!userId) return;
    let nextEntry = {
      id: editingRecipe!.id,
      date: editingRecipe!.date,
      mealType: editingRecipe!.mealType,
      recipeId: recipe.id,
      recipeName: recipe.title,
      category: recipe.category,
      imageUrl: recipe.image || "",
    };
    await updateMealPlan({
      id: nextEntry.id,
      recipe_id: nextEntry.recipeId,
      updated_at: new Date().toISOString(),
      userId: userId,
    });
    showToast(
      `Updated ${recipe.title} for ${formatDayLabel(nextEntry.date)} (${nextEntry.mealType}).`,
      "success",
    );
    mealPlans = mealPlans.filter(
      (meal) =>
        !(meal.date === nextEntry.date && meal.mealType === nextEntry.mealType),
    );

    mealPlans = [...mealPlans, nextEntry];
  }

  async function selectRecipe(action: "edit" | "add", recipe: IRecipe) {
    try {
      if (action === "edit") {
        await editMeal(recipe);
      } else {
        await addMeal(recipe);
      }
      handleModalClose();
    } catch (error) {
      console.error("Failed to save meal plan:", error);
      showToast("Unable to save meal plan. Please try again.", "error");
    }
  }

  function handleModalClose() {
    modalOpen = false;
    editingRecipe = null;
    pendingMealSlot = { date: "", mealType: "" };
    searchQuery = "";
  }

  function editRecipe(event: CustomEvent) {
    if (!event.detail) return;
    const { id, date, mealType, recipeId } = event.detail;
    editingRecipe = {
      id,
      date,
      mealType,
      recipeId,
    };
    modalOpen = true;
  }

  function ondeleteRecipe(event: CustomEvent) {
    const meal = event.detail;
    if (!meal?.id) return;

    deleteTarget = {
      id: meal.id,
      title: meal.recipeName || "this meal",
    };
  }

  function cancelDeleteMeal() {
    deleteTarget = null;
  }

  async function confirmDeleteMeal() {
    if (!deleteTarget) return;

    const mealId = deleteTarget.id;

    try {
      await deleteMealPlan(mealId, userId);
      mealPlans = mealPlans.filter((meal) => meal.id !== mealId);
      showToast("Meal removed.", "success");
    } catch (err) {
      console.error("Failed to delete recipe", err);
      showToast("Unable to delete meal.", "error");
    } finally {
      deleteTarget = null;
    }
  }

  function clearDay(event: CustomEvent) {
    const date = event.detail;
    clearTarget = { type: "day", date };
  }

  function onclearWeek() {
    clearTarget = { type: "week" };
  }

  function cancelClear() {
    clearTarget = null;
  }

  function getWeekDateRange(): { startDate: string; endDate: string } {
    const currentDate = new Date();
    const day = currentDate.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const startDate = new Date(currentDate);
    startDate.setDate(currentDate.getDate() + diffToMonday);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    return {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    };
  }

  function confirmClear() {
    if (!clearTarget) return;

    if (clearTarget.type === "day" && clearTarget.date) {
      const targetDate = clearTarget.date;

      clearMealPlansForDate(targetDate, userId)
        .then(() => {
          mealPlans = mealPlans.filter((meal) => meal.date !== targetDate);
          showToast(
            `Meals cleared for ${formatDayLabel(targetDate)}.`,
            "success",
          );
          clearTarget = null;
        })
        .catch((err) => {
          console.error("Failed to clear meals for date", err);
          showToast("Unable to clear meals for this day.", "error");
          clearTarget = null;
        });
      return;
    }

    const { startDate, endDate } = getWeekDateRange();

    clearWeek(userId, startDate, endDate)
      .then(() => {
        mealPlans = [];
        showToast("This week was cleared.", "success");
        clearTarget = null;
      })
      .catch((err) => {
        console.error("Failed to clear meals for the week", err);
        showToast("Unable to clear the week.", "error");
      });
  }

  function getModalTitle(): string {
    if (editingRecipe) {
      return `Update recipe for ${formatDayLabel(editingRecipe.date)} (${editingRecipe.mealType}).`;
    }
    return `Add a recipe for ${formatDayLabel(pendingMealSlot.date)} (${pendingMealSlot.mealType}).`;
  }
</script>

<meal-planner
  bind:this={planner}
  week-start-date={getCurrentDate()}
  {mealPlans}
  onaddRecipe={addRecipe}
  oneditRecipe={editRecipe}
  {ondeleteRecipe}
  onclearDay={clearDay}
  {onclearWeek}
>
</meal-planner>

<app-modal
  open={modalOpen}
  modal-title={getModalTitle()}
  onmodalClose={handleModalClose}
>
  <div class="modal-content">
    <label class="search-label" for="recipe-search">Search recipes</label>
    <input
      id="recipe-search"
      class="recipe-search"
      type="search"
      bind:value={searchQuery}
      oninput={handleSearch}
      placeholder="Find a recipe..."
    />

    <div class="recipe-list" aria-live="polite">
      {#if loadingRecipes}
        <p class="empty-state">Loading recipes...</p>
      {:else if filteredRecipes.length === 0}
        <p class="empty-state">No recipes match your search.</p>
      {:else}
        {#each filteredRecipes as recipe (recipe.id)}
          <button
            type="button"
            class={`recipe-item ${editingRecipe && editingRecipe.recipeId === recipe.id ? "selected-recipe" : ""}`}
            onclick={() => selectRecipe(editingRecipe ? "edit" : "add", recipe)}
          >
            {#if recipe.image}
              <img class="recipe-image" src={recipe.image} alt={recipe.title} />
            {/if}

            <div class="recipe-details">
              <div class="recipe-text">
                <strong>{recipe.title}</strong>
                <span>{recipe.category}</span>
              </div>
              <small>{recipe.description}</small>
            </div>
          </button>
        {/each}
      {/if}
    </div>
  </div>
</app-modal>

<ConfirmDeleteModal
  open={deleteTarget !== null}
  title="Delete meal"
  confirmLabel="Delete"
  onConfirm={confirmDeleteMeal}
  onCancel={cancelDeleteMeal}
>
  <p>
    Are you sure you want to delete
    <strong>{deleteTarget?.title ?? "this meal"}</strong>?
  </p>
</ConfirmDeleteModal>

<ConfirmDeleteModal
  open={clearTarget !== null}
  title={clearTarget?.type === "day" ? "Clear day" : "Clear week"}
  confirmLabel={clearTarget?.type === "day" ? "Clear" : "Clear week"}
  onConfirm={confirmClear}
  onCancel={cancelClear}
>
  {#if clearTarget?.type === "day" && clearTarget.date}
    <p>
      Are you sure you want to clear all meals for
      <strong>{formatDayLabel(clearTarget.date)}</strong>?
    </p>
  {:else}
    <p>Are you sure you want to clear the entire week?</p>
  {/if}
</ConfirmDeleteModal>

<style>
  .modal-content {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
    min-width: min(420px, 80vw);
    background: #fbfffc;
  }

  .search-label {
    font-size: 0.78rem;
    font-weight: 700;
    color: #2f5d46;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .recipe-search {
    width: 100%;
    box-sizing: border-box;
    padding: 0.8rem 0.9rem;
    border: 1px solid #cfe5d6;
    border-radius: 10px;
    font-size: 0.95rem;
    background: #ffffff;
    color: #123728;
  }

  .recipe-list {
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
    max-height: 260px;
    overflow-y: auto;
    padding-right: 0.25rem;
  }

  .recipe-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #dfece2;
    border-radius: 10px;
    background: #f9fdfb;
    text-align: left;
    cursor: pointer;
    transition:
      border-color 0.2s ease,
      background 0.2s ease;
  }

  .recipe-item:hover {
    border-color: #7ed7a2;
    background: #f2fff7;
  }

  .recipe-image {
    width: 60px;
    height: 60px;
    border-radius: 10px;
    object-fit: cover;
    flex-shrink: 0;
    background: #e5e7eb;
  }

  .recipe-details {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
  }

  .recipe-text {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    margin-bottom: 0.2rem;
    color: #123728;
  }

  .recipe-text strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .recipe-text span {
    font-size: 0.75rem;
    font-weight: 600;
    color: #4f6f5d;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    white-space: nowrap;
  }

  .recipe-item small {
    color: #3f5f50;
    line-height: 1.4;
  }

  .empty-state {
    margin: 0;
    padding: 1rem;
    color: #6b7280;
    background: #f3f4f6;
    border: 1px dashed #d1d5db;
    border-radius: 10px;
  }

  .recipe-item.selected-recipe {
    border-color: #34d399;
    background: #e6ffed;
  }
</style>

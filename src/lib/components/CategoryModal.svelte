<script lang="ts">
  import { getUserId, showToast } from "$lib/helpers/utils";
  import { fetchCategoryOptions, createCategory } from "$lib/api";
  import { onMount } from "svelte";

  type Category = {
    id: string;
    name: string;
  };

  let {
    open = false,
    onConfirm,
    onCancel,
    confirmLabel = "Create",
  } = $props<{
    open: boolean;
    onConfirm: (
      type: "category" | "subcategory",
      name: string,
      categoryId?: string,
    ) => void;
    onCancel: () => void;
    title?: string;
    confirmLabel?: string;
  }>();

  let activeTab = $state<"category" | "subcategory">("category");

  let categoryName = $state("");
  let subcategoryName = $state("");
  let selectedCategoryId = $state("");

  let categories = $state<Category[]>([]);
  let isLoadingCategories = $state(false);
  let categoryFetchError = $state("");

  let categoryError = $state("");
  let subcategoryError = $state("");
  let subcategoryCategoryError = $state("");

  let categoriesFetched = false;

  let modalTitle = $derived(
    activeTab === "category" ? "Create Category" : "Create Subcategory",
  );

  const resetState = () => {
    activeTab = "category";
    categoryName = "";
    subcategoryName = "";
    selectedCategoryId = "";

    categoryError = "";
    subcategoryError = "";
    subcategoryCategoryError = "";

    categories = [];
    categoriesFetched = false;
    categoryFetchError = "";
  };

  onMount(() => {
    return () => {
      resetState();
    };
  });

  const fetchCategories = async () => {
    if (categoriesFetched) return;

    isLoadingCategories = true;
    categoryFetchError = "";

    try {
      const userId = getUserId();
      const categoriesData = await fetchCategoryOptions(userId);
      categories = (categoriesData ?? []).filter((c) => c.parent_id === null);
      categoriesFetched = true;
    } catch (error) {
      categoryFetchError = "Unable to load categories. Please try again.";
    } finally {
      isLoadingCategories = false;
    }
    if (categoryFetchError) {
      showToast(categoryFetchError, "error");
    }
  };

  const handleTabChange = async (tab: "category" | "subcategory") => {
    activeTab = tab;

    categoryError = "";
    subcategoryError = "";
    subcategoryCategoryError = "";

    categoryName = "";
    subcategoryName = "";
    selectedCategoryId = "";

    if (tab === "subcategory" && categories.length === 0 && !categoriesFetched) {
      await fetchCategories();
    }
  };

  const validateCategory = () => {
    categoryError = "";

    if (!categoryName.trim()) {
      categoryError = "Category name is required.";
      return false;
    }

    return true;
  };

  const validateSubcategory = () => {
    subcategoryCategoryError = "";
    subcategoryError = "";

    let isValid = true;

    if (!selectedCategoryId) {
      subcategoryCategoryError = "Please select a category.";
      isValid = false;
    }

    if (!subcategoryName.trim()) {
      subcategoryError = "Subcategory name is required.";
      isValid = false;
    }

    return isValid;
  };

  const handleConfirm = async () => {
    if (activeTab === "category") {
      if (!validateCategory()) return;
    } else {
      if (!validateSubcategory()) return;
    }
    try {
      const userId = getUserId();
      const name = activeTab === "category" ? categoryName.trim() : subcategoryName.trim();
      await createCategory({ name, parent_id: activeTab === "category" ? null : selectedCategoryId }, userId);
      showToast(`${activeTab} created successfully!`, "success");
      onConfirm();
    } catch (error) {
      showToast(`Failed to create ${activeTab}.`, "error");
    }
  };
</script>

{#if open}
  <app-modal
    {open}
    modal-title={modalTitle}
    close-on-backdrop={true}
    close-on-escape={true}
    onmodalClose={onCancel}
  >
    <div class="create-container">
      <!-- Tabs -->
      <div class="tabs" role="tablist">
        <button
          type="button"
          class:active={activeTab === "category"}
          role="tab"
          aria-selected={activeTab === "category"}
          onclick={() => handleTabChange("category")}
        >
          Category
        </button>

        <button
          type="button"
          class:active={activeTab === "subcategory"}
          role="tab"
          aria-selected={activeTab === "subcategory"}
          onclick={() => handleTabChange("subcategory")}
        >
          Subcategory
        </button>
      </div>

      <!-- Category form -->
      {#if activeTab === "category"}
        <div class="form-group">
          <label for="categoryName"> Category name </label>

          <input
            id="categoryName"
            type="text"
            name="categoryName"
            placeholder="Enter category name"
            bind:value={categoryName}
            class:error={!!categoryError}
          />

          {#if categoryError}
            <p class="error-message">{categoryError}</p>
          {/if}
        </div>
      {/if}

      <!-- Subcategory form -->
      {#if activeTab === "subcategory"}
        <div class="form-group">
          <label for="category"> Category </label>

          <select
            id="category"
            bind:value={selectedCategoryId}
            class:error={!!subcategoryCategoryError}
          >
            <option value="">Select category</option>

            {#each categories as category}
              <option value={category.id}>
                {category.name}
              </option>
            {/each}
          </select>

          {#if subcategoryCategoryError}
            <p class="error-message">
              {subcategoryCategoryError}
            </p>
          {/if}
        </div>

        <div class="form-group">
          <label for="subcategoryName"> Subcategory name </label>

          <input
            id="subcategoryName"
            type="text"
            name="subcategoryName"
            placeholder="Enter subcategory name"
            bind:value={subcategoryName}
            disabled={!selectedCategoryId}
            class:error={!!subcategoryError}
          />

          {#if subcategoryError}
            <p class="error-message">{subcategoryError}</p>
          {/if}
        </div>
      {/if}
    </div>

    <div slot="footer" class="actions">
      <button type="button" class="cancel" onclick={onCancel}> Cancel </button>

      <button type="button" class="create" onclick={handleConfirm}>
        {confirmLabel}
      </button>
    </div>
  </app-modal>
{/if}

<style>
  .create-container {
    padding: 8px 0;
  }

  /* Tabs */

  .tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 20px;
    padding: 4px;

    background: #f3f4f6;
    border-radius: 8px;
  }

  .tabs button {
    flex: 1;
    padding: 8px 12px;

    border: 0;
    border-radius: 6px;

    background: transparent;
    color: #6b7280;

    font-size: 14px;
    font-weight: 500;

    cursor: pointer;
    transition:
      background 0.15s ease,
      color 0.15s ease;
  }

  .tabs button:hover {
    color: #374151;
  }

  .tabs button.active {
    background: #fff;
    color: #f59e0b;

    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }

  /* Form */

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 16px;
  }

  .form-group label {
    color: #374151;
    font-size: 14px;
    font-weight: 500;
  }

  input,
  select {
    width: 100%;
    box-sizing: border-box;

    padding: 10px 12px;

    border: 1px solid #e5e7eb;
    border-radius: 8px;

    background: #fff;
    color: #374151;

    font-family: inherit;
    font-size: 14px;

    transition:
      border-color 0.15s ease,
      box-shadow 0.15s ease;
  }

  input:focus,
  select:focus {
    outline: none;
    border-color: #f59e0b;
    box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.12);
  }

  input::placeholder {
    color: #9ca3af;
  }

  input:disabled {
    background: #f9fafb;
    color: #9ca3af;
    cursor: not-allowed;
  }

  input.error,
  select.error {
    border-color: #dc2626;
  }

  input.error:focus,
  select.error:focus {
    border-color: #dc2626;
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
  }

  .error-message {
    margin: 0;

    color: #dc2626;
    font-size: 12px;
    line-height: 1.4;
  }

  /* Footer */

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 5px;
  }

  .actions button {
    padding: 9px 18px;

    border-radius: 8px;
    border: 1px solid #ddd;

    background: #fff;

    font-family: inherit;
    font-size: 14px;

    cursor: pointer;
  }

  .cancel {
    color: #374151;
  }

  .cancel:hover {
    background: #f3f4f6;
  }

  .create {
    color: #fff;
    background: #f59e0b !important;
    border-color: #f59e0b !important;
  }

  .create:hover {
    background: #d97706 !important;
    border-color: #d97706 !important;
  }
</style>

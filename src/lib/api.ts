import type { CategoryOption, Recipe } from "./types";
import { supabase, type DbRecipe } from "./supabase";
import { toRecipe } from "./helpers/utils";

export type { CategoryRef, CategoryOption, Recipe } from "./types";

export async function fetchCategoryOptions(userId: string): Promise<CategoryOption[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, parent_id")
    .or(`created_by.eq.system,created_by.eq.${userId}`);

  if (error) {
    console.error("[API] Fetch category options error:", error);
    throw error;
  }

  const normalized = (data || [])
    .map((row: any) => {
      const id = String(row.id ?? "").trim();
      const name = String(row.name ?? "").trim();
      if (!id || !name) return null;

      return {
        id,
        name,
        parent_id: row.parent_id ?? null,
      };
    })
    .filter(Boolean) as CategoryOption[];

  return normalized;
}

export async function createCategory(category: Omit<CategoryOption, "id">, userId: string): Promise<CategoryOption> {
  const payload: Partial<CategoryOption> & { created_by: string } = {
    name: category.name,
    parent_id: category.parent_id,
    created_by: userId, // Use the provided user ID
  };

  const { data, error } = await supabase
    .from("categories")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("[API] Create category error:", error);
    throw error;
  }

  return data as CategoryOption;
}


export async function fetchRecipes(
  searchTerm?: string | null,
  categoryId?: string | null,
  subcategoryId?: string | null,
  userId?: string | null,
  page = 1,
  pageSize = 10,
): Promise<{ recipes: Recipe[]; count: number }> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  let query = supabase
    .from("recipes")
    .select(
      "*, category:category_id(id, name), subcategory:subcategory_id(id, name)",
      { count: "exact" },
    )
    .eq("is_deleted", false)
    .range(from, to)
    .order("updated_at", { ascending: false });

  if (userId) {
    query = query.or(`created_by.is.null,created_by.eq.${userId}`);
  } else {
    query = query.is("created_by", null);
  }

  if (searchTerm?.trim()) {
    query = query.ilike("title", `%${searchTerm.trim()}%`);
  }

  if (categoryId && categoryId !== "all") {
    query = query.eq("category_id", categoryId);
  }

  if (subcategoryId && subcategoryId !== "all") {
    query = query.eq("subcategory_id", subcategoryId);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("[API] Fetch recipes error:", error);
    throw error;
  }

  const recipes = ((data as DbRecipe[] | null) || []).map(toRecipe);
  return { recipes, count: count ?? recipes.length };
}

export async function fetchRecipeById(
  id: string,
  userId?: string,
): Promise<Recipe | null> {
  let query = supabase
    .from("recipes")
    .select(
      "*, category:category_id(id, name), subcategory:subcategory_id(id, name)",
    )
    .eq("id", id)
    .eq("is_deleted", false)
    .single();

  if (userId) {
    query.eq("created_by", userId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[API] Fetch recipe by ID error:", error);
    throw error;
  }

  return data ? toRecipe(data) : null;
}

export async function createRecipe(
  recipe: Omit<Recipe, "id">,
): Promise<Recipe> {
  const payload: Partial<DbRecipe> = {
    title: recipe.title,
    image: recipe.image,
    description: recipe.description,
    ingredients: recipe.ingredients,
    steps: recipe.steps,
    category_id: recipe.category_id,
    subcategory_id: recipe.subcategory_id ?? null,
    created_by: (recipe as any).createdBy || "user",
  };

  const { data, error } = await supabase
    .from("recipes")
    .insert(payload)
    .select(
      "*, category:category_id(id, name), subcategory:subcategory_id(id, name)",
    )
    .single();

  if (error) {
    console.error("[API] Create recipe error:", error);
    throw error;
  }

  return toRecipe(data as DbRecipe);
}

export async function updateRecipe(
  id: string,
  updates: Partial<Recipe>,
  userId: string,
): Promise<Recipe> {
  const payload: Partial<DbRecipe> = {
    title: updates.title,
    image: updates.image,
    description: updates.description,
    ingredients: updates.ingredients,
    steps: updates.steps,
    category_id: updates.category_id,
    subcategory_id: updates.subcategory_id ?? null,
    updated_by: (updates as any).updatedBy || "user",
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("recipes")
    .update(payload)
    .eq("is_deleted", false)
    .eq("id", id)
    .eq("created_by", userId)
    .select(
      "*, category:category_id(id, name), subcategory:subcategory_id(id, name)",
    )
    .single();

  if (error) {
    console.error("[API] Update recipe error:", error);
    throw error;
  }

  return toRecipe(data as DbRecipe);
}

export async function deleteRecipe(id: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("recipes")
    .update({ is_deleted: true })
    .eq("id", id)
    .eq("is_deleted", false)
    .eq("created_by", userId);

  if (error) {
    console.error("[API] Delete recipe error:", error);
    throw error;
  }
}

// Favorites table: favorites(user_id, recipe_id)
export async function fetchFavorites(
  userId: string,
  page: number = 1,
  pageSize: number = 10,
): Promise<Recipe[]> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabase
    .from("favorites")
    .select(
      "recipe_id, recipe:recipe_id(title, image, description, ingredients, steps, category_id, category:category_id(id, name), subcategory_id, subcategory:subcategory_id(id, name))",
    )
    .eq("user_id", userId)
    .range(from, to)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[API] Fetch favorites error:", error);
    throw error;
  }

  return (data || []).map((row: any) => ({
    id: row.recipe_id,
    title: row.recipe?.title || "",
    image: row.recipe?.image || "",
    description: row.recipe?.description || "",
    ingredients: row.recipe?.ingredients || [],
    steps: row.recipe?.steps || [],
    category: row.recipe?.category ?? null,
    subcategory: row.recipe?.subcategory ?? null,
    category_id: row.recipe?.category_id,
    subcategory_id: row.recipe?.subcategory_id,
  }));
}

export async function toggleFavorite(
  userId: string,
  recipeId: string,
  isFavorite: boolean,
): Promise<void> {
  if (isFavorite) {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", userId)
      .eq("recipe_id", recipeId);

    if (error) {
      console.error("[API] Remove favorite error:", error);
      throw error;
    }

    return;
  }

  const { error } = await supabase
    .from("favorites")
    .insert({ user_id: userId, recipe_id: recipeId });

  if (error) {
    console.error("[API] Add favorite error:", error);
    throw error;
  }
}

// Meal plans table: user_id, meal_type, recipe_id
export async function fetchMealPlan(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<any[]> {
  const { data, error } = await supabase
    .from("meal_plans")
    .select(
      "*, recipe:recipe_id(title, image, description, ingredients, steps, category_id, category:category_id(id, name), subcategory_id, subcategory:subcategory_id(id, name))",
    )
    .eq("user_id", userId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[API] Fetch meal plan error:", error);
    throw error;
  }

  return (data || []) as any[];
}

export async function saveMealPlan(entry: {
  user_id: string;
  meal_type: string;
  recipe_id: string;
  updated_by: string;
  updated_at: string;
  date: string;
}): Promise<void> {
  const payload = {
    user_id: entry.user_id,
    meal_type: entry.meal_type,
    date: entry.date,
    recipe_id: entry.recipe_id,
    updated_by: entry.updated_by,
    updated_at: entry.updated_at,
  };

  const { error } = await supabase.from("meal_plans").upsert(payload).select();

  if (error) {
    console.error("[API] Save meal plan error:", error);
    throw error;
  }
}

export async function updateMealPlan(entry: {
  id: string;
  recipe_id: string;
  updated_at: string;
  userId: string;
}): Promise<void> {
  const payload = {
    recipe_id: entry.recipe_id,
    updated_at: entry.updated_at,
  };

  const { error } = await supabase
    .from("meal_plans")
    .update(payload)
    .eq("id", entry.id)
    .eq("user_id", entry.userId);

  if (error) {
    console.error("[API] Update meal plan error:", error);
    throw error;
  }
}

export async function clearMealPlansForDate(
  date: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("meal_plans")
    .delete()
    .eq("date", date)
    .eq("user_id", userId);

  if (error) {
    console.error("[API] Clear meal plans for date error:", error);
    throw error;
  }
}

export async function deleteMealPlan(
  id: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("meal_plans")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("[API] Delete meal plan error:", error);
    throw error;
  }
}

export async function clearWeek(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<void> {
  const { error } = await supabase
    .from("meal_plans")
    .delete()
    .eq("user_id", userId)
    .gte("date", startDate)
    .lte("date", endDate);

  if (error) {
    console.error("[API] Clear week error:", error);
    throw error;
  }
}

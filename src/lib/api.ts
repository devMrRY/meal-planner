export type CategoryRef = {
  id: string;
  name: string;
} | null;

export interface Recipe {
  id: string;
  title: string;
  summary?: string;
  image: string;
  description: string;
  ingredients: string[];
  steps: string[];
  category: CategoryRef;
  subcategory: CategoryRef;
  category_id?: string | null;
  subcategory_id?: string | null;
  isDeleted: boolean;
  createdBy: string;
  createdAt: Date;
  updatedBy?: string | null;
  updatedAt?: Date | null;
}

export type CategoryOption = {
  id: string;
  name: string;
  parent_id: string | null;
};

import { supabase, type DbRecipe } from "./supabase";

function toRecipe(db: DbRecipe): Recipe {
  return {
    id: db.id,
    title: db.title,
    image: db.image || "",
    description: db.description || "",
    ingredients: db.ingredients || [],
    steps: db.steps || [],
    category: db.category ?? null,
    subcategory: db.subcategory ?? null,
    category_id: db.category_id,
    subcategory_id: db.subcategory_id,
    isDeleted: db.is_deleted ?? false,
    createdBy: db.created_by ?? "system",
    createdAt: db.created_at ? new Date(db.created_at) : new Date(),
    updatedBy: db.updated_by ?? "system",
    updatedAt: db.updated_at ? new Date(db.updated_at) : null,
  };
}

export async function fetchCategoryOptions(): Promise<CategoryOption[]> {
  console.log("[API] Fetching category options...");

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, parent_id");
  if (error) {
    console.warn("[API] Fetch category options error (non-fatal):", error);
    return [];
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

  console.log("[API] Fetched category options:", normalized.length);
  return normalized;
}

export async function fetchRecipes(
  searchTerm?: string,
  categoryId?: string | null,
  subcategoryId?: string | null,
  page = 1,
  pageSize = 10,
): Promise<Recipe[]> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  let query = supabase
    .from("recipes")
    .select(
      "*, category:category_id(id, name), subcategory:subcategory_id(id, name)",
    )
    .eq("is_deleted", false)
    .range(from, to)
    .order("updated_at", { ascending: false });

  if (searchTerm?.trim()) {
    query = query.ilike("title", `%${searchTerm.trim()}%`);
  }

  if (categoryId && categoryId !== "all") {
    query = query.eq("category_id", categoryId);
  }

  if (subcategoryId && subcategoryId !== "all") {
    query = query.eq("subcategory_id", subcategoryId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[API] Fetch recipes error:", error);
    return [];
  }

  const recipes = ((data as DbRecipe[] | null) || []).map(toRecipe);
  return recipes;
}

export async function fetchUserRecipes(userId: string, page: number = 1, pageSize: number = 10): Promise<Recipe[]> {
  console.log("[API] Fetching recipes for user:", userId);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabase
    .from("recipes")
    .select(
      "*, category:category_id(id, name), subcategory:subcategory_id(id, name)",
    )
    .eq("is_deleted", false)
    .eq("created_by", userId)
    .range(from, to)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[API] Fetch user recipes error:", error);
    return [];
  }

  return ((data as DbRecipe[] | null) || []).map(toRecipe);
}

export async function createRecipe(
  recipe: Omit<Recipe, "id" | "createdBy">,
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
  if (error) throw error;
  return toRecipe(data as DbRecipe);
}

export async function updateRecipe(
  id: string,
  updates: Partial<Recipe>,
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
    .select(
      "*, category:category_id(id, name), subcategory:subcategory_id(id, name)",
    )
    .single();
  if (error) throw error;
  return toRecipe(data as DbRecipe);
}

export async function deleteRecipe(id: string): Promise<void> {
  const { error } = await supabase
    .from("recipes")
    .update({ is_deleted: true })
    .eq("id", id);

  if (error) throw error;
}

// Favorites table: favorites(user_id, recipe_id)
export async function fetchFavorites(userId: string, page: number = 1, pageSize: number = 10): Promise<Recipe[]> {
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
    console.warn("[API] Fetch favorites error (non-fatal):", error);
    return [];
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
    await supabase
      .from("favorites")
      .delete()
      .eq("user_id", userId)
      .eq("recipe_id", recipeId);
  } else {
    await supabase
      .from("favorites")
      .insert({ user_id: userId, recipe_id: recipeId });
  }
}

// Meal plans table: user_id, meal_type, recipe_id
export async function fetchMealPlan(userId: string): Promise<any[]> {
  console.log("[API] Fetching meal plan for user:", userId);
  const { data, error } = await supabase
    .from("meal_plans")
    .select(
      "*, recipe:recipe_id(title, image, description, ingredients, steps, category_id, category:category_id(id, name), subcategory_id, subcategory:subcategory_id(id, name))",
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.warn("[API] Fetch meal plan error (non-fatal):", error);
    return [];
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
    console.warn("[API] Save meal plan error:", error);
  } else {
    console.log("[API] Meal plan saved");
  }
}

export async function updateMealPlan(entry: {
  id: string;
  recipe_id: string;
  updated_at: string;
}): Promise<void> {
  const payload = {
    recipe_id: entry.recipe_id,
    updated_at: entry.updated_at,
  };
  const { error } = await supabase
    .from("meal_plans")
    .update(payload)
    .eq("id", entry.id);

  if (error) {
    console.warn("[API] Update meal plan error:", error);
  }
}

export async function clearMealPlansForDate(date: string): Promise<void> {
  const { error } = await supabase.from("meal_plans").delete().eq("date", date);
  if (error) {
    console.warn("[API] Clear meal plans for date error:", error);
  }
}

export async function deleteMealPlan(id: string): Promise<void> {
  const { error } = await supabase.from("meal_plans").delete().eq("id", id);
  if (error) {
    console.warn("[API] Delete meal plan error:", error);
  }
  console.log("[API] Meal plan deleted");
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
    console.error("[API] Clear meal plans for date error:", error);
  }
}

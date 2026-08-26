export interface Recipe {
  id: string;
  title: string;
  summary: string;
  image: string;
  description: string;
  ingredients: string[];
  steps: string[];
  category: string;
  subcategory: string;
  isDeleted: boolean;
  createdBy: 'user' | 'system';
  createdAt: Date;
}

export type CategoryOption = {
  id: string;
  name: string;
  parent_id: string | null;
};

import { supabase, type DbRecipe } from './supabase';

function formatError(error: any): string {
  if (!error) return 'Unknown error';
  if (error.message) return error.message;
  if (typeof error === 'string') return error;
  return JSON.stringify(error);
}

function toRecipe(db: DbRecipe): Recipe {
  return {
    id: db.id,
    title: db.title,
    summary: db.summary || '',
    image: db.image || '',
    description: db.description || '',
    ingredients: db.ingredients || [],
    steps: db.steps || [],
    category: db.category || 'general',
    subcategory: db.subcategory || 'general',
    isDeleted: db.is_deleted ?? db.isDeleted ?? false,
    createdBy: db.created_by === 'system' ? 'system' : 'user',
    createdAt: db.created_at ? new Date(db.created_at) : new Date()
  };
}

export async function fetchCategoryOptions(): Promise<CategoryOption[]> {
  console.log('[API] Fetching category options...');

  const { data, error } = await supabase.from('categories').select('id, name, parent_id');
  if (error) {
    console.warn('[API] Fetch category options error (non-fatal):', error);
    return [];
  }

  const normalized = (data || [])
    .map((row: any) => {
      const id = String(row.id ?? '').trim();
      const name = String(row.name ?? '').trim();
      if (!id || !name) return null;

      return {
        id,
        name,
        parent_id: row.parent_id ?? null
      };
    })
    .filter(Boolean) as CategoryOption[];

  console.log('[API] Fetched category options:', normalized.length);
  return normalized;
}

export async function fetchRecipes(): Promise<Recipe[]> {
  console.log('[API] Fetching active recipes...');

  const { data, error } = await supabase.from('recipes').select('*');
  if (error) {
    console.error('[API] Fetch recipes error:', error);
    return [];
  }

  const recipes = (data as DbRecipe[] | null || [])
    .filter((recipe) => {
      const value = recipe.is_deleted ?? recipe.isDeleted ?? false;
      return value === false;
    })
    .map(toRecipe);

  console.log('[API] Fetched active recipes:', recipes.length);
  return recipes;
}

export async function fetchUserRecipes(userId: string): Promise<Recipe[]> {
  console.log('[API] Fetching recipes for user:', userId);

  const { data, error } = await supabase.from('recipes').select('*').eq('created_by', userId);
  if (error) {
    console.error('[API] Fetch user recipes error:', error);
    return [];
  }

  return (data as DbRecipe[] | null || [])
    .filter((recipe) => {
      const value = recipe.is_deleted ?? recipe.isDeleted ?? false;
      return value === false;
    })
    .map(toRecipe);
}

export async function createRecipe(recipe: Omit<Recipe, 'id' | 'createdBy' | 'createdAt'>): Promise<Recipe> {
  const payload: Partial<DbRecipe> = {
    title: recipe.title,
    summary: recipe.summary,
    image: recipe.image,
    description: recipe.description,
    ingredients: recipe.ingredients,
    steps: recipe.steps,
    category: recipe.category,
    subcategory: recipe.subcategory,
    is_deleted: false,
    isDeleted: false,
    created_by: (recipe as any).createdBy || (recipe as any).created_by || 'user'
  };

  const { data, error } = await supabase.from('recipes').insert(payload).select().single();
  if (error) throw error;
  return toRecipe(data as DbRecipe);
}

export async function updateRecipe(id: string, updates: Partial<Recipe>): Promise<Recipe> {
  const payload: Partial<DbRecipe> = {
    title: updates.title,
    summary: updates.summary,
    image: updates.image,
    description: updates.description,
    ingredients: updates.ingredients,
    steps: updates.steps,
    category: updates.category,
    subcategory: updates.subcategory,
    is_deleted: updates.isDeleted ?? false,
    isDeleted: updates.isDeleted ?? false
  };

  const { data, error } = await supabase.from('recipes').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return toRecipe(data as DbRecipe);
}

export async function deleteRecipe(id: string): Promise<void> {
  const { error } = await supabase
    .from('recipes')
    .update({ is_deleted: true, isDeleted: true })
    .eq('id', id);

  if (error) throw error;
}

// Favorites table: favorites(user_id, recipe_id)
export async function fetchFavorites(userId: string): Promise<string[]> {
  console.log('[API] Fetching favorites for user:', userId);
  const { data, error } = await supabase.from('favorites').select('recipe_id').eq('user_id', userId);
  if (error) {
    console.warn('[API] Fetch favorites error (non-fatal):', error);
    return [];
  }
  console.log('[API] Fetched favorites:', data?.length || 0);
  return (data || []).map((r: any) => r.recipe_id);
}

export async function toggleFavorite(userId: string, recipeId: string): Promise<void> {
  // Check existing
  const { data } = await supabase.from('favorites').select('*').eq('user_id', userId).eq('recipe_id', recipeId).maybeSingle();
  if (data) {
    await supabase.from('favorites').delete().eq('user_id', userId).eq('recipe_id', recipeId);
  } else {
    await supabase.from('favorites').insert({ user_id: userId, recipe_id: recipeId });
  }
}

// Meal plans table: meal_plans(user_id, plan json)
export async function fetchMealPlan(userId: string): Promise<any> {
  console.log('[API] Fetching meal plan for user:', userId);
  const { data, error } = await supabase.from('meal_plans').select('plan').eq('user_id', userId).maybeSingle();
  if (error) {
    console.warn('[API] Fetch meal plan error (non-fatal):', error);
    return null;
  }
  console.log('[API] Fetched meal plan:', data?.plan || null);
  return data?.plan || null;
}

export async function saveMealPlan(userId: string, plan: any): Promise<void> {
  console.log('[API] Saving meal plan for user:', userId);
  const { error } = await supabase.from('meal_plans').upsert({ user_id: userId, plan }).select();
  if (error) {
    console.warn('[API] Save meal plan error:', error);
    // Non-fatal - don't throw
  } else {
    console.log('[API] Meal plan saved');
  }
}

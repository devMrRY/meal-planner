import type { Recipe } from "$lib/types";
import type { DbRecipe } from "$lib/supabase";

export const getUserId = () => {
  let userId = localStorage.getItem("userId");
  if (userId) {
    return userId;
  }
  userId = `user_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem("userId", userId);
  return userId;
};

export function getCurrentDate(): string {
  const today = new Date();

  const date = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
  return date;
}

export function showToast(
  message: string,
  type: "success" | "error" | "info" = "info",
) {
  if (typeof window !== "undefined" && window.showToast) {
    window.showToast(message, type);
  } else {
    console.log(`[${type.toUpperCase()}] ${message}`);
  }
}

export function findRecipeTitle(recipes: Recipe[], id: string | null): string {
  return recipes.find((recipe) => recipe.id === id)?.title ?? "";
}

export function debounce<T extends (...args: any[]) => void>(
  callback: T,
  delay: number,
) {
  let timeout: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => callback(...args), delay);
  };
}

export const getPlaceholderUrl = () =>
  `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
      <rect width="400" height="300" fill="#f3f4f6"/>

      <g fill="none" stroke="#9ca3af" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <rect x="145" y="85" width="110" height="90" rx="8"/>
        <circle cx="175" cy="115" r="8"/>
        <path d="M150 160l28-28 22 20 15-14 35 22"/>
      </g>

      <text
        x="200"
        y="215"
        text-anchor="middle"
        font-family="Arial, sans-serif"
        font-size="18"
        fill="#9ca3af"
      >
        No image available
      </text>
    </svg>
  `)}`;

export function toRecipe(db: DbRecipe): Recipe {
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

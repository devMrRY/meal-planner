export const getUserId = () => {
  let userId = localStorage.getItem("userId");
  if (userId) {
    return userId;
  }
  userId = `user_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem("userId", userId);
  return userId;
};

export function categoryNameOf(value: string | undefined): string {
  if (!value) return "";
  return value.trim();
}

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

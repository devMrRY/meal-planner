/// <reference types="@sveltejs/kit" />
declare global {
  interface Window {
    showToast?: (
      message: string,
      type?: "success" | "error" | "info",
    ) => void;
  }
}
export {};

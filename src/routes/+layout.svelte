<script lang="ts">
  import { page } from "$app/state";
  import { onMount } from "svelte";
  import { defineCustomElements } from "@recipe-planner/recipe-components/loader";
  import { getUserId } from "../helpers/utils";

  declare global {
    interface Window {
      showToast?: (
        message: string,
        type?: "success" | "error" | "info",
      ) => void;
    }
  }

  type ToastType = "success" | "error" | "info";

  type ToastItem = {
    id: number;
    message: string;
    type: ToastType;
  };

  let { children } = $props();
  let toasts = $state<ToastItem[]>([]);

  const navItems = [
    { label: "All Recipes", href: "/" },
    { label: "Favourites", href: "/favourites" },
    { label: "Meal Planner", href: "/meal-planner" },
    { label: "My Recipes", href: "/my-recipes" },
  ];

  function showToast(message: string, type: ToastType = "info") {
    const id = Date.now() + Math.random();
    toasts = [...toasts, { id, message, type }];

    setTimeout(() => {
      toasts = toasts.filter((toast) => toast.id !== id);
    }, 3000);
  }

  onMount(() => {
    defineCustomElements(window);
    getUserId();

    const handleToastEvent = (event: Event) => {
      const detail = (
        event as CustomEvent<{ message?: string; type?: ToastType }>
      ).detail;
      if (!detail?.message) return;
      showToast(detail.message, detail.type ?? "info");
    };

    window.addEventListener("app:toast", handleToastEvent);
    window.showToast = showToast;

    return () => {
      window.removeEventListener("app:toast", handleToastEvent);
      delete (window as typeof window & { showToast?: typeof showToast })
        .showToast;
    };
  });
</script>

<div class="app-shell">
  <nav class="topbar" aria-label="Main navigation">
    <a href="/" class="brand">Recipe Planner</a>
    <div class="nav-links">
      {#each navItems as item}
        <a href={item.href} class:active={page.url.pathname === item.href}
          >{item.label}</a
        >
      {/each}
    </div>
  </nav>

  <main class="page-content">
    {@render children()}
  </main>

  <div class="toast-stack" aria-live="polite" aria-atomic="true">
    {#each toasts as toast (toast.id)}
      <div class={`toast toast-${toast.type}`} role="status">
        <span>{toast.message}</span>
        <button
          type="button"
          aria-label="Dismiss notification"
          onclick={() => {
            toasts = toasts.filter((item) => item.id !== toast.id);
          }}
        >
          ×
        </button>
      </div>
    {/each}
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    font-family: Arial, sans-serif;
    background: #f3f4f6;
    color: #111827;
  }

  .app-shell {
    min-height: 100vh;
    background: #f9fafb;
  }

  .topbar {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.85rem 1.5rem;
    background: #111827;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 2px 12px rgba(15, 23, 42, 0.08);
  }

  .brand {
    color: #fff;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    text-decoration: none;
  }

  .nav-links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .nav-links a {
    color: #d1d5db;
    text-decoration: none;
    padding: 0.55rem 0.85rem;
    border-radius: 999px;
    font-size: 0.95rem;
    transition: 0.2s ease;
  }

  .nav-links a:hover,
  .nav-links a:focus-visible,
  .nav-links a.active {
    background: #f59e0b;
    color: #111827;
  }

  .page-content {
    padding: 1.5rem;
  }

  .toast-stack {
    position: fixed;
    bottom: 1rem;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    z-index: 1000;
    pointer-events: none;
  }

  .toast {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    min-width: 240px;
    max-width: 360px;
    padding: 0.8rem 0.9rem;
    border-radius: 12px;
    box-shadow: 0 12px 25px rgba(15, 23, 42, 0.15);
    background: #fff;
    border: 1px solid #e5e7eb;
    pointer-events: auto;
    font-size: 0.94rem;
    color: #111827;
  }

  .toast-success {
    background: #ecfdf5;
    border-color: #a7f3d0;
    color: #166534;
  }

  .toast-error {
    background: #fef2f2;
    border-color: #fecaca;
    color: #991b1b;
  }

  .toast-info {
    background: #eff6ff;
    border-color: #bfdbfe;
    color: #1d4ed8;
  }

  .toast button {
    border: none;
    background: transparent;
    color: inherit;
    font-size: 1.1rem;
    cursor: pointer;
    line-height: 1;
    padding: 0;
    opacity: 0.8;
  }
</style>

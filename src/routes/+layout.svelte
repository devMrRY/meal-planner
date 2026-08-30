<script lang="ts">
  import { page } from "$app/state";
  import { onMount } from "svelte";
  import { getUserId } from "$lib/helpers/utils";

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

  function showToastMessage(message: string, type: ToastType = "info") {
    const id = Date.now() + Math.random();
    toasts = [...toasts, { id, message, type }];

    setTimeout(() => {
      toasts = toasts.filter((toast) => toast.id !== id);
    }, 3000);
  }

  onMount(() => {
    import('@reticentrahul/recipe-planner/meal-planner'),
    import('@reticentrahul/recipe-planner/recipe-list'),
    import('@reticentrahul/recipe-planner/recipe-card'),
    import('@reticentrahul/recipe-planner/recipe-detail'),
    import('@reticentrahul/recipe-planner/recipe-form'),
    import('@reticentrahul/recipe-planner/app-modal')

    window.showToast = showToastMessage;
    getUserId();

    return () => {
      window.showToast = undefined;
    };
  });
</script>

<div class="app-shell">
  <nav class="topbar" aria-label="Main navigation">
    <a href="/" class="brand"
      ><img
        width="50"
        height="50"
        src="https://img.icons8.com/arcade/50/fast-food.png"
        alt="fast-food"
      />
      Recipe<span class="brand-highlight">Planner</span></a
    >
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
        <span class="toast-icon" aria-hidden="true">
          {#if toast.type === "success"}
            ✓
          {:else if toast.type === "error"}
            !
          {:else}
            i
          {/if}
        </span>

        <span class="toast-message">
          {toast.message}
        </span>

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
    font-family:
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;
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
    background: #fff;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 2px 12px rgba(15, 23, 42, 0.08);
  }

  .brand {
    color: #111827;
    outline: none;
    font-weight: 600;
    text-decoration: none;
    display: flex;
    align-items: center;
    font-family:
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      Roboto,
      Oxygen,
      Ubuntu,
      Cantarell,
      "Open Sans",
      "Helvetica Neue",
      sans-serif;
  }

  .brand-highlight {
    color: #f59e0b;
  }

  .nav-links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .nav-links a {
    color: #000000;
    text-decoration: none;
    font-family: system-ui, "Open Sans", "Helvetica Neue", sans-serif;
    padding: 0.55rem 0.85rem;
    border-radius: 999px;
    font-size: 0.95rem;
    transition: 0.2s ease;
  }

  .nav-links a:hover,
  .nav-links a:focus-visible,
  .nav-links a.active {
    background: #f59e0b;
    color: #fff;
  }

  .page-content {
    padding: 1.5rem;
  }

  .toast-stack {
    position: fixed;
    bottom: 1.5rem;
    left: 50%;
    transform: translateX(-50%);

    display: flex;
    flex-direction: column;
    gap: 0.7rem;

    width: min(420px, calc(100vw - 2rem));

    z-index: 1000;
    pointer-events: none;
  }

  .toast {
    position: relative;

    display: flex;
    align-items: center;
    gap: 0.85rem;

    width: 100%;
    box-sizing: border-box;

    padding: 0.9rem 0.85rem 0.9rem 1rem;

    border-radius: 14px;

    background: #ffffff;
    border: 1px solid #e5e7eb;

    box-shadow:
      0 12px 25px rgba(15, 23, 42, 0.1),
      0 3px 8px rgba(15, 23, 42, 0.05);

    font-size: 0.94rem;
    font-weight: 500;
    line-height: 1.4;

    color: #111827;

    pointer-events: auto;
    overflow: hidden;

    animation: toast-slide-in 0.3s ease-out;

    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }

  /* Left accent */

  .toast::before {
    content: "";

    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;

    width: 4px;

    background: #94a3b8;
  }

  /* Message */

  .toast-message {
    flex: 1;
    min-width: 0;
  }

  /* Icon */

  .toast-icon {
    flex: 0 0 28px;

    width: 28px;
    height: 28px;

    display: flex;
    align-items: center;
    justify-content: center;

    border-radius: 50%;

    font-size: 0.9rem;
    font-weight: 800;
  }

  /* Success */

  .toast-success {
    background: #f0fdf4;
    border-color: #bbf7d0;
    color: #166534;
  }

  .toast-success::before {
    background: #22c55e;
  }

  .toast-success .toast-icon {
    background: #22c55e;
    color: #ffffff;
  }

  /* Error */

  .toast-error {
    background: #fef2f2;
    border-color: #fecaca;
    color: #991b1b;
  }

  .toast-error::before {
    background: #ef4444;
  }

  .toast-error .toast-icon {
    background: #ef4444;
    color: #ffffff;
  }

  /* Info */

  .toast-info {
    background: #eff6ff;
    border-color: #bfdbfe;
    color: #1d4ed8;
  }

  .toast-info::before {
    background: #3b82f6;
  }

  .toast-info .toast-icon {
    background: #3b82f6;
    color: #ffffff;
  }

  /* Close button */

  .toast button {
    flex: 0 0 28px;

    width: 28px;
    height: 28px;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    padding: 0;

    border: none;
    border-radius: 50%;

    background: rgba(15, 23, 42, 0.06);

    color: inherit;

    font-size: 1.15rem;
    font-weight: 400;
    line-height: 1;

    cursor: pointer;

    opacity: 0.7;

    transition:
      background 0.15s ease,
      opacity 0.15s ease,
      transform 0.15s ease;
  }

  .toast button:hover {
    opacity: 1;
    background: rgba(15, 23, 42, 0.1);
    transform: scale(1.05);
  }

  .toast button:active {
    transform: scale(0.95);
  }

  .toast button:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }

  /* Animation */

  @keyframes toast-slide-in {
    from {
      opacity: 0;
      transform: translateY(12px) scale(0.97);
    }

    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  /* Mobile */

  @media (max-width: 480px) {
    .toast-stack {
      bottom: 1rem;
      width: calc(100vw - 1.5rem);
    }

    .toast {
      padding: 0.8rem 0.75rem 0.8rem 0.9rem;
      font-size: 0.9rem;
    }
  }
</style>

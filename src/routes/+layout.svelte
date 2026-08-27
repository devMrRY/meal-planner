<script lang="ts">
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { defineCustomElements } from '@recipe-planner/recipe-components/loader';

  let { children } = $props();

  const navItems = [
    { label: 'All Recipes', href: '/' },
    { label: 'Favourites', href: '/favourites' },
    { label: 'Meal Planner', href: '/meal-planner' },
    { label: 'My Recipes', href: '/my-recipes' }
  ];

  onMount(() => {
    defineCustomElements(window);
  });
</script>

<div class="app-shell">
  <nav class="topbar" aria-label="Main navigation">
    <a href="/" class="brand">Recipe Planner</a>
    <div class="nav-links">
      {#each navItems as item}
        <a href={item.href} class:active={page.url.pathname === item.href}>{item.label}</a>
      {/each}
    </div>
  </nav>

  <main class="page-content">
    {@render children()}
  </main>
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
</style>

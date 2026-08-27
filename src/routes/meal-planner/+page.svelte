<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchMealPlan, saveMealPlan } from '$lib/api';

  let mealPlan = $state<any>(null);
  let userId = $state('');
  let isLoading = $state(true);

  let mealPlannerEl = $state<(HTMLElement & { plan?: any }) | null>(null);

  function genUserId() {
    const existing = localStorage.getItem('rp_user');
    if (existing) return existing;

    const id = 'user_' + Math.random().toString(36).slice(2, 9);
    localStorage.setItem('rp_user', id);
    return id;
  }

  const handlePlanChange = async (event: Event) => {
    const plan = (event as CustomEvent<any>).detail;
    mealPlan = plan;

    try {
      await saveMealPlan(userId, plan);
    } catch (e) {
      console.error('[MealPlannerPage] save error:', e);
    }
  };

  onMount(async () => {
    userId = genUserId();
    mealPlan = await fetchMealPlan(userId);
    isLoading = false;
  });

  $effect(() => {
    if (mealPlannerEl) {
      mealPlannerEl.plan = mealPlan;
    }
  });
</script>

<section class="route-page">
  <h1>Meal Planner</h1>

  {#if isLoading}
    <p>Loading meal plan...</p>
  {:else}
    <meal-planner bind:this={mealPlannerEl} onplanchange={handlePlanChange}></meal-planner>
  {/if}
</section>

<style>
  .route-page {
    max-width: 1100px;
    margin: 0 auto;
    padding: 2rem 0;
  }

  h1 {
    margin-bottom: 1rem;
    font-size: 2rem;
  }

  p {
    color: #4b5563;
  }
</style>

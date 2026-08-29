<script lang="ts">
  import type { Snippet } from "svelte";
  let { children, title, description }: { children?: Snippet; title?: string; description?: string } = $props();
</script>

<div class="empty-state">
  <div class="empty-icon" aria-hidden="true">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path
        d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v17H6.5A2.5 2.5 0 0 1 4 17.5v-12Z"
      />
      <path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H19" />
      <path d="M8 7h7" />
      <path d="M8 10h5" />
    </svg>
  </div>

  {#if title}
    <h2>{title}</h2>
  {/if}

  {#if description}
    <p>
      {description}
    </p>
  {/if}
  <div class="empty-state-children">
    {#if children}
      {@render children()}
    {/if}
  </div>
</div>

<style>
  .empty-state {
    min-height: 55vh;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    padding: 40px 24px;
    text-align: center;
  }

  .empty-icon {
    width: 72px;
    height: 72px;

    display: flex;
    align-items: center;
    justify-content: center;

    margin-bottom: 18px;

    border-radius: 20px;

    background: linear-gradient(135deg, #fffbeb 0%, #fff7ed 100%);

    border: 1px solid #f3dfad;

    color: #d97706;

    box-shadow:
      0 8px 20px rgba(245, 158, 11, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
  }

  .empty-icon svg {
    width: 34px;
    height: 34px;
  }

  .empty-state h2 {
    margin: 0 0 8px;

    color: #292524;

    font-size: 1.35rem;
    font-weight: 700;
    line-height: 1.3;
  }

  .empty-state p {
    max-width: 430px;

    margin: 0 0 22px;

    color: #78716c;

    font-size: 0.95rem;
    line-height: 1.6;
  }

  @media (max-width: 600px) {
    .empty-state {
      min-height: 50vh;
      padding: 30px 18px;
    }

    .empty-icon {
      width: 64px;
      height: 64px;
      border-radius: 18px;
    }

    .empty-icon svg {
      width: 30px;
      height: 30px;
    }

    .empty-state h2 {
      font-size: 1.2rem;
    }

    .empty-state p {
      font-size: 0.9rem;
    }
  }
</style>

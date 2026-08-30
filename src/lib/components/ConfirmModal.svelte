<script lang="ts">
  import type { Snippet } from "svelte";
  let {
    open = false,
    onConfirm,
    onCancel,
    title = "Delete Recipe",
    confirmLabel = "Delete",
    children,
  } = $props<{
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    title?: string;
    confirmLabel?: string;
    children?: Snippet;
  }>();
</script>

<app-modal
  {open}
  modal-title={title}
  close-on-backdrop={true}
  close-on-escape={true}
  onmodalClose={onCancel}
>
  <div class="confirmation">
    {#if children}
      {@render children()}
    {/if}
  </div>
  <div slot="footer" class="actions">
    <button type="button" onclick={onCancel}> Cancel </button>

    <button type="button" class="delete" onclick={onConfirm}> {confirmLabel} </button>
  </div>
</app-modal>

<style>
  .confirmation {
    padding: 8px 0;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 5px;
  }

  button {
    padding: 9px 18px;
    border-radius: 8px;
    border: 1px solid #ddd;
    background: white;
    cursor: pointer;
  }

  button:hover {
    background: #f3f4f6;
  }

  .delete {
    color: #c2410c;
    background: #fff;
    border: 1px solid #e7cfc5;
  }

  .delete:hover {
    background: #fff7ed;
    border-color: #ea580c;
  }
</style>

<script>
  import { running } from "../stores/code";

  export let title;
  export let disabled;
</script>

<style>
  button {
    position: fixed;
    top: 40px;
    right: 60px;
    width: 48px;
    height: 48px;
    border: 0;
    border-radius: 50%;
    z-index: 9999;
    cursor: pointer;
    background: var(--accent-color);
    transition: all 0.5s;
    user-select: none;
  }

  button {
    font-size: 24px;
    color: var(--bg-color);
  }

  button:hover {
    box-shadow: var(--shadow);
  }

  button:disabled {
    cursor: not-allowed;
  }
</style>

<button on:click {title} {disabled}>
  <slot />
</button>

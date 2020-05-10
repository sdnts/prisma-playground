<script>
  export let active = false;
</script>

<style>
  button {
    border: 0;
    height: 100%;
    position: relative;
    background-color: var(--bg-color);
    color: var(--inactive-color);
    font-family: monospace;
    font-size: 14px;
    cursor: pointer;
  }

  button.active {
    color: var(--fg-color);
  }

  button.active:after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 3px;
    background-color: var(--accent-color);
  }
</style>

<button class:active on:click>
  <slot />
</button>

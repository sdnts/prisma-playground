<script>
  import { onMount } from "svelte";
  import { level, visible, messages } from "../stores/toast";

  let interval;
  let setNextMessage = () =>
    (activeIndex = Math.min(activeIndex + 1, $messages.length - 1));

  $: activeIndex = 0;
  $: {
    if (!$visible) {
      interval && clearInterval(interval);
    } else {
      activeIndex = 0;
      interval = setInterval(setNextMessage, 3000);
    }
  }
</script>

<style>
  aside {
    display: flex;
    justify-content: center;
    position: fixed;
    top: 20px;
    left: 0;
    right: 0;
    margin: auto;
    transition: all 0.3s;
    transform: translateY(-60px);
  }

  aside.visible {
    transform: translateY(0);
  }

  div {
    color: var(--bg-color);
    padding: 10px 30px;
    z-index: 99;
    border-radius: 3px;
    box-shadow: var(--shadow);
  }

  div.info {
    background-color: var(--accent-color);
  }

  div.error {
    background-color: var(--error-color);
  }
</style>

<aside class:visible={$visible}>
  <div class:info={$level === 'INFO'} class:error={$level === 'ERROR'}>
    {$messages[activeIndex] || ''}
  </div>
</aside>

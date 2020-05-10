<script>
  import { onMount } from "svelte";
  import { visible, output } from "../stores/output";

  onMount(() => {
    const root = document.querySelector(".output");
    const editor = CodeMirror(root, {
      value: $output,
      mode: "application/ld+json",
      theme: "material-darker",
      readOnly: true
    });

    output.subscribe(o => editor.setValue(o));
  });

  let toggle = () => visible.set(!$visible);
</script>

<style>
  section {
    display: flex;
    flex-direction: column;
    font-family: monospace;
    transition: all 0.3s;
    overflow: hidden;
  }

  header {
    border-top: 1px solid var(--border-color);
    display: flex;
    flex-direction: row-reverse;
    flex: 0 0 20px;
    padding: 5px 10px;
  }

  button {
    border: 0;
    padding: 0;
    height: 20px;
    width: 20px;
    background-color: inherit;
    color: var(--icon-color);
    font-size: 18px;
    transition: all 0.3s;
    position: relative;
    cursor: pointer;
  }

  button:after {
    content: "▴";
    font-size: 24px;
    position: absolute;
    top: -8px;
    left: 0;
    right: 0;
  }

  button:hover {
    color: var(--fg-color);
  }

  button.open {
    transform: rotate(180deg);
  }

  .output {
    padding: 0 20px;
  }

  .output.visible {
    flex: 1;
  }
</style>

<section style="flex: 0 0 {$visible ? 300 : 30}px;">
  <header>
    <button class:open={$visible} on:click={toggle} />
  </header>
  <div class="output" class:visible={$visible} />
</section>

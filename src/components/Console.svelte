<script>
  import { onMount } from "svelte";
  import consoleStore from "../stores/console";

  onMount(() => {
    const root = document.querySelector(".console");
    const editor = CodeMirror(root, {
      value: "[]",
      mode: "text/javascript",
      theme: "material-darker",
      readOnly: true
    });

    consoleStore.subscribe(({ value }) => {
      editor.setValue(value);
    });
  });
</script>

<style>
  section {
    display: flex;
    flex-direction: column;
    background-color: #212121;
    font-family: monospace;
    transition: all 0.3s;
    overflow: hidden;
  }

  header {
    border-top: 1px solid #545454;
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
    color: #545454;
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
    color: #eeffff;
  }

  button.open {
    transform: rotate(180deg);
  }

  .console {
    padding: 0 20px;
  }

  .console.visible {
    flex: 1;
  }
</style>

<section style="flex: 0 0 {$consoleStore.visible ? 300 : 30}px;">
  <header>
    <button class:open={$consoleStore.visible} on:click={consoleStore.toggle} />
  </header>
  <div class="console" class:visible={$consoleStore.visible} />
</section>

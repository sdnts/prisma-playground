<script>
  import { onMount, createEventDispatcher } from "svelte";

  import { code, running } from "../stores/code";
  import { output, visible as outputVisible } from "../stores/output";
  import { API_URL } from "../constants";

  import Button from "./Button.svelte";

  const dispatch = createEventDispatcher();

  onMount(() => {
    const root = document.querySelector(".code");
    const editor = CodeMirror(root, {
      value: $code,
      lineNumbers: true,
      matchBrackets: true,
      mode: "text/typescript",
      autofocus: true,
      theme: "material-darker"
    });

    code.subscribe(c => editor.setValue(c));
  });

  let run = () => dispatch("run");
</script>

<style>
  section {
    flex: 1;
  }
</style>

<section class="code" />
<Button title="Run Code" on:click={run} disabled={$running}>
  {#if $running}·{:else}ᐈ{/if}
</Button>

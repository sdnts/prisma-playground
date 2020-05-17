<script>
  import { onMount, createEventDispatcher } from "svelte";

  import { code, running } from "../stores/code";

  import Button from "./Button.svelte";

  const dispatch = createEventDispatcher();

  onMount(() => {
    const root = document.querySelector(".code");
    const editor = CodeMirror(root, {
      value: $code,
      lineNumbers: true,
      autoCloseBrackets: true,
      matchBrackets: true,
      continueComments: true,
      mode: "text/typescript",
      autofocus: true,
      theme: "material-darker"
    });
    editor.addKeyMap({
      "Cmd-/": "toggleComment",
      "Ctrl-/": "toggleComment"
    });

    editor.on("changes", () => code.set(editor.getValue()));
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

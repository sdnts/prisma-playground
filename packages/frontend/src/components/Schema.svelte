<script>
  import { onMount, createEventDispatcher } from "svelte";

  import { schema, saving } from "../stores/schema";
  import Button from "./Button.svelte";

  const dispatch = createEventDispatcher();

  onMount(() => {
    const root = document.querySelector(".schema");
    const editor = CodeMirror(root, {
      value: $schema,
      lineNumbers: true,
      autoCloseBrackets: true,
      matchBrackets: true,
      continueComments: true,
      mode: "text/x-groovy",
      autofocus: true,
      theme: "material-darker"
    });
    editor.addKeyMap({
      "Cmd-/": "toggleComment",
      "Ctrl-/": "toggleComment"
    });

    editor.on("changes", () => schema.set(editor.getValue()));
  });

  let save = () => dispatch("save");
</script>

<style>
  section {
    flex: 1;
  }
</style>

<section class="schema" />
<Button title="Save Schema & Migrate" on:click={save} disabled={$saving}>
  {#if $saving}⊙{:else}🦅{/if}
</Button>

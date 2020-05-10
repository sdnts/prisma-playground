<script>
  import { onMount } from "svelte";

  import { schema, saving } from "../stores/schema";
  import Button from "./Button.svelte";

  onMount(() => {
    const root = document.querySelector(".schema");
    const editor = CodeMirror(root, {
      value: $schema,
      lineNumbers: true,
      matchBrackets: true,
      mode: "text/x-groovy",
      autofocus: true,
      theme: "material-darker"
    });

    schema.subscribe(c => editor.setValue(c));
  });

  let save = () => {
    console.log("Saving");
    saving.set(true);
  };
</script>

<style>
  section {
    flex: 1;
  }
</style>

<section class="schema" />
<Button title="Save Schema" on:click={save}>✓</Button>

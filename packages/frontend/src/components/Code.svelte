<script>
  import { onMount } from "svelte";

  import { code, running } from "../stores/code";
  import { output, visible as outputVisible } from "../stores/output";

  import Button from "./Button.svelte";

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

  let run = () => {
    console.log("Running");
    running.set(true);
    output.set("[]");
    outputVisible.set(true);
  };
</script>

<style>
  section {
    flex: 1;
  }
</style>

<section class="code" />
<Button title="Run Code" on:click={run}>ᐈ</Button>

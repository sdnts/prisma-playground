<script>
  import { onMount } from "svelte";

  export let code = "";

  onMount(() => {
    const root = document.querySelector(".code");
    const editor = CodeMirror(root, {
      value: code,
      lineNumbers: true,
      matchBrackets: true,
      mode: "text/typescript",
      autofocus: true,
      theme: "material-darker"
    });
  });
</script>

<style>
  section {
    flex: 1;
  }
</style>

<section class="code" />

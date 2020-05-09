<script>
  import { onMount } from "svelte";

  onMount(() => {
    const root = document.querySelector(".code");
    if (root) {
      var myCodeMirror = CodeMirror(root, {
        value: "function myScript(){return 100;}\n",
        lineNumbers: true,
        matchBrackets: true,
        mode: "text/typescript"
      });
    }
  });
</script>

<section class="code" />

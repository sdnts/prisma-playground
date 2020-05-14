<script>
  import { onMount, getContext } from "svelte";

  import { code, running } from "../stores/code";
  import { output, visible as outputVisible } from "../stores/output";
  import { API_URL } from "../constants";

  import Button from "./Button.svelte";

  const workspaceId = getContext("workspaceId");

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

  let run = async () => {
    running.set(true);
    const { error, workspace, output } = await fetch(`${API_URL}/workspace`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ id: workspaceId })
    });
    console.log(error, workspace, output);

    output.set(output);
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

<script>
  import Editor from "../components/Editor.svelte";
  import RunButton from "../components/RunButton.svelte";
  import Console from "../components/Console.svelte";
</script>

<style>
  main {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
</style>

<main>
  <Editor />
  <RunButton />
  <Console />
</main>

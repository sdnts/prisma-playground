<script context="module">
  export async function preload(page) {
    const { id } = page.params;

    try {
      const res = await this.fetch(`api/workspace?id=${id}`);
      const workspace = await res.json();

      if (!workspace) {
        return this.error(404, "Not found");
      }

      return { workspace };
    } catch (e) {
      console.error("Failed to fetch workspace: ", e);
      this.error(500, "Internal Server Error");
    }
  }
</script>

<script>
  import Editor from "../../components/Editor.svelte";
  import RunButton from "../../components/RunButton.svelte";
  import Console from "../../components/Console.svelte";

  export let workspace;
</script>

<style>
  main {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
</style>

<main>
  <Editor code={workspace.code} />
  <RunButton />
  <Console />
</main>

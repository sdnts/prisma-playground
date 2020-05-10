<script>
  import { goto } from "@sapper/app";

  export async function create() {
    const res = await fetch("/api/workspace", {
      method: "POST"
    });
    const workspace = await res.json();

    console.log("Created workspace", workspace);
    await goto(`/workspace/${workspace.id}`);
  }
</script>

<button on:click={create}>Create Workspace</button>

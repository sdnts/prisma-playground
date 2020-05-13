<script>
  import { goto } from "@sapper/app";

  import { API_URL } from "../constants/url";

  export async function create() {
    const res = await fetch(`${API_URL}/workspace`, {
      method: "POST"
    });
    const workspace = await res.json();

    console.log("Created workspace", workspace);
    await goto(`/workspace/${workspace.id}`);
  }
</script>

<button on:click={create}>Create Workspace</button>

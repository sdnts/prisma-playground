<script context="module">
  import { API_URL } from "../../constants";

  export async function preload(page) {
    const { id } = page.params;

    try {
      const res = await this.fetch(`${API_URL}/workspace?id=${id}`);
      const { error, workspace } = await res.json();

      if (res.status === 404) {
        return this.error(404, "Not found");
      }

      if (res.status !== 200 || error) {
        return this.error(500, "Internal Server Error");
      }

      return { workspace };
    } catch (e) {
      console.error("Failed to fetch workspace: ", e);
      this.error(500, "Internal Server Error");
    }
  }
</script>

<script>
  import { setContext } from "svelte";

  import { active } from "../../stores/tabs";
  import { code } from "../../stores/code";
  import { schema } from "../../stores/schema";

  import Tab from "../../components/Tab.svelte";
  import Code from "../../components/Code.svelte";
  import Schema from "../../components/Schema.svelte";
  import Output from "../../components/Output.svelte";

  export let workspace;

  setContext("workspaceId", workspace.id);

  code.set(workspace.code);
  schema.set(workspace.schema);

  let switchToCode = () => active.set("code");
  let switchToSchema = () => active.set("schema");
</script>

<style>
  main {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  nav {
    flex: 0 0 30px;
    margin-bottom: 10px;
  }
</style>

<main>
  <nav>
    <Tab active={$active === 'code'} on:click={switchToCode}>Code</Tab>
    <Tab active={$active === 'schema'} on:click={switchToSchema}>Schema</Tab>
  </nav>

  {#if $active === 'code'}
    <Code />
  {:else if $active === 'schema'}
    <Schema />
  {/if}

  <Output />
</main>

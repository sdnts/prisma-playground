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
  import { active } from "../../stores/tabs";
  import { code } from "../../stores/code";
  import { schema } from "../../stores/schema";

  import Tab from "../../components/Tab.svelte";
  import Code from "../../components/Code.svelte";
  import Schema from "../../components/Schema.svelte";
  import Output from "../../components/Output.svelte";

  export let workspace;

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

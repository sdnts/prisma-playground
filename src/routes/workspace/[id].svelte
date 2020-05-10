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

  button {
    border: 0;
    height: 100%;
    position: relative;
    background-color: var(--bg-color);
    color: var(--fg-color);
    cursor: pointer;
  }

  button.active:after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 3px;
    background-color: var(--accent-color);
  }
</style>

<main>
  <nav>
    <button class:active={$active === 'code'} on:click={switchToCode}>
      Code
    </button>
    <button class:active={$active === 'schema'} on:click={switchToSchema}>
      Schema
    </button>
  </nav>

  {#if $active === 'code'}
    <Code />
  {:else if $active === 'schema'}
    <Schema />
  {/if}

  <Output />
</main>

<script context="module">
  import { API_URL } from "../../constants";

  export async function preload(page) {
    const { id } = page.params;

    try {
      const res = await this.fetch(`${API_URL}/workspace/${id}`);
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
  import { active } from "../../stores/tabs";
  import { code, running } from "../../stores/code";
  import { schema, saving } from "../../stores/schema";

  import Tab from "../../components/Tab.svelte";
  import Code from "../../components/Code.svelte";
  import Schema from "../../components/Schema.svelte";
  import Output from "../../components/Output.svelte";

  export let workspace;
  console.log(workspace);

  code.set(workspace.code);
  schema.set(workspace.schema);

  let switchToCode = () => active.set("code");
  let switchToSchema = () => active.set("schema");

  export let runCode = async () => {
    try {
      running.set(true);
      console.log("running", $code);
      const response = await fetch(`${API_URL}/workspace/${workspace.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ code: $code })
      });
      console.log("what", response);

      // output.set(output);
      // outputVisible.set(true);
    } catch (e) {
      console.log("err", e);
    }
  };

  export let saveSchema = async () => {};
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
    <Code on:run={runCode} />
  {:else if $active === 'schema'}
    <Schema on:save={saveSchema} />
  {/if}

  <Output />
</main>

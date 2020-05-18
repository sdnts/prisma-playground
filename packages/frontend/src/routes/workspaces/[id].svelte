<script context="module">
  import { API_URL } from "../../constants";

  export async function preload(page) {
    const { id } = page.params;

    try {
      const res = await this.fetch(`${API_URL}/workspaces/${id}`);
      const { error, workspace } = await res.json();

      if (res.status === 404) {
        console.error("Workspace not found with ID: ", id);
        return this.error(404, "Not found");
      }

      if (res.status !== 200 || error) {
        throw error;
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
  import {
    stdout,
    stderr,
    visible as outputVisible
  } from "../../stores/output";
  import {
    level as toastLevel,
    visible as toastVisible,
    messages as toastMessages
  } from "../../stores/toast";

  import Tab from "../../components/Tab.svelte";
  import Code from "../../components/Code.svelte";
  import Schema from "../../components/Schema.svelte";
  import Output from "../../components/Output.svelte";
  import Toast from "../../components/Toast.svelte";

  export let workspace;

  code.set(workspace.code);
  schema.set(workspace.schema);

  let switchToCode = () => active.set("code");
  let switchToSchema = () => active.set("schema");

  export let runCode = async () => {
    try {
      toastLevel.set("INFO");
      toastMessages.set(["Running code", "Running code", "Any second now"]);
      toastVisible.set(true);
      running.set(true);

      let response = await fetch(`${API_URL}/workspaces/${workspace.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ code: $code })
      });
      response = await response.json();
      console.log("Response: ", response);

      toastVisible.set(false);
      stdout.set(response.output.stdout);
      stderr.set(response.output.stderr);
    } catch (e) {
      console.log("Error in PUT request: ", e);
      stderr.set(e.toString());
      toastLevel.set("ERROR");
      toastMessages.set(["Something ain't right. Check the DevTools Console."]);
    } finally {
      running.set(false);
      outputVisible.set(true);
    }
  };

  export let saveSchema = async () => {
    try {
      toastLevel.set("INFO");
      toastMessages.set([
        "Migrating your database",
        "Saving schema",
        "Any second now"
      ]);
      toastVisible.set(true);
      saving.set(true);

      let response = await fetch(`${API_URL}/workspaces/${workspace.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ schema: $schema })
      });
      response = await response.json();
      console.log("Response: ", response);

      toastVisible.set(false);
      stdout.set(response.output.stdout);
      stderr.set(response.output.stderr);
    } catch (e) {
      console.log("Error in PUT request: ", e);
      stderr.set(e.toString());
      toastLevel.set("ERROR");
      toastMessages.set(["Something ain't right. Check the DevTools Console."]);
    } finally {
      saving.set(false);
      outputVisible.set(true);
    }
  };
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
  <Toast />
</main>

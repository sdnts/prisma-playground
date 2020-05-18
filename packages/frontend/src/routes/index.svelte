<script>
  import { goto } from "@sapper/app";

  import {
    level as toastLevel,
    visible as toastVisible,
    messages as toastMessages
  } from "../stores/toast";

  import Toast from "../components/Toast.svelte";
  import { API_URL } from "../constants";

  export async function create() {
    try {
      toastMessages.set([
        "Provisioning database",
        "Setting up defaults",
        "Any second now",
        "So... weather's nice, huh?",
        "Er... I swear it's working",
        "I really appreciate your patience",
        "If you're seeing this, you've been waiting way too long",
        "You know what, something's probably broken",
        "Yeah, shoot an email to me@madebysid.com please!"
      ]);
      toastVisible.set(true);

      const res = await fetch(`${API_URL}/workspaces`, {
        method: "POST"
      });
      const response = await res.json();
      console.log("Response: ", response);

      const { workspace } = response;

      toastVisible.set(false);
      await goto(`./workspaces/${workspace.id}`);
    } catch (e) {
      console.log("Error in POST request: ", e);
      toastLevel.set("ERROR");
      toastMessages.set(["Something ain't right. Check the DevTools Console."]);
    }
  }
</script>

<style>
  main {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 80px;
  }

  section {
    max-width: 800px;
  }

  h1 {
    color: var(--accent-color);
    font-size: 32px;
    font-weight: normal;
    margin: 0;
    margin-bottom: 40px;
  }

  h3 {
    color: var(--fg-color);
    font-size: 16px;
    font-weight: normal;
    margin: 0;
    margin-bottom: 30px;
  }

  p {
    color: var(--fg-color);
    font-size: 12px;
    opacity: 0.3;
  }

  button {
    border: none;
    border-radius: 3px;
    background-color: var(--accent-color);
    color: var(--bg-color);
    font-size: 16px;
    font-family: monospace;
    height: 60px;
    padding: 10px 20px;
    margin-top: 60px;
    cursor: pointer;
    transition: all 0.3s;
  }

  button:hover {
    box-shadow: var(--shadow);
  }
</style>

<main>
  <section>
    <h1>👋</h1>
    <h1>This is a Prisma Playground.</h1>

    <h3>
      A "workspace" here is a portable Prisma project. Each workspace is backed
      by a real Postgres database that you can query using Prisma Client. You
      can also change the database's schema and it will migrate automatically!
    </h3>

    <h3>
      Workspaces are all public and do not need you to sign in. They're also
      automatically deleted after 7 days of inactivity, so don't count on it
      existing forever. RDS ain't cheap.
    </h3>

    <h3>
      One could argue that this exact workflow is easier, faster and more stable
      on CodeSandbox. And I would agree.
      <p>(That's it, I cannot justify this existing lol)</p>
    </h3>
    <br />
    <br />
  </section>

  <section>
    <h3>
      Alright let's get started. When you click this button, a database will be
      provisioned for you, and will be initialized with a Prisma schema. I think
      you'll figure out the rest:
    </h3>
  </section>

  <section>
    <button on:click={create}>Create a Workspace</button>
  </section>

  <Toast />
</main>

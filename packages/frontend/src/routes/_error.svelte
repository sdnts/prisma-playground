<script>
  export let status;
  export let error;

  const dev = process.env.NODE_ENV === "development";
</script>

<style>
  section {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 80px;
  }

  h1 {
    color: var(--accent-color);
    font-size: 48px;
    font-weight: normal;
    margin: 0;
    margin-bottom: 40px;
  }

  h3 {
    color: var(--fg-color);
    font-size: 24px;
    font-weight: normal;
    margin: 0;
    margin-bottom: 30px;
  }

  p,
  a {
    color: var(--fg-color);
    font-size: 16px;
    margin-bottom: 10px;
  }

  a:visited,
  a:active {
    color: var(--fg-color);
  }

  p.explain {
    opacity: 0.4;
    font-size: 14px;
    margin-bottom: 60px;
  }
</style>

<section>
  <h1>{status}</h1>

  {#if status === 404}
    <h3>Nothing here.</h3>
    <p>The workspace you requested is now in a better place.</p>
    <p class="explain">
      (Workspaces that stay inactive for 7 days are automatically deleted)
    </p>
  {:else}
    <h3>{error.message}</h3>
  {/if}

  <a href="/glass/triangles">Back Home</a>

  {#if dev && error.stack}
    <pre>{error.stack}</pre>
  {/if}

</section>

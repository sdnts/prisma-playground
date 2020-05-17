<script context="module">
  export async function preload(page) {
    const { id } = page.params;

    return { id };
  }
</script>

<script>
  export let id;
</script>

<div>This works {id}</div>

<script>
  import { onMount } from "svelte";

  onMount(() => {
    const root = document.querySelector(".code");
    const editor = CodeMirror(root, {
      value: `import { PrismaClient } from '@prisma/client'
			
const prisma = new PrismaClient();

const main = async () => {
	const users = await prisma.user.findMany();
	console.log(users);
}

main()
	.catch(e => console.log(e))
	.finally(() => prisma.disconnect())
			`,
      lineNumbers: true,
      matchBrackets: true,
      mode: "text/typescript",
      autofocus: true,
      theme: "material-darker"
    });
  });
</script>

<style>
  section {
    flex: 1;
  }
</style>

<section class="code" />

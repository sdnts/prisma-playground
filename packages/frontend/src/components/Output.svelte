<script>
  import { onMount } from "svelte";

  import { visible, stdout, stderr } from "../stores/output";
  import Tab from "./Tab.svelte";

  onMount(() => {
    const stdoutRoot = document.querySelector(".stdout");
    const stdoutEditor = CodeMirror(stdoutRoot, {
      value: $stdout,
      mode: "application/ld+json",
      theme: "material-darker",
      readOnly: true
    });

    stdout.subscribe(o => stdoutEditor.setValue(o));

    const stderrRoot = document.querySelector(".stderr");
    const stderrEditor = CodeMirror(stderrRoot, {
      value: $stderr,
      mode: "application/ld+json",
      theme: "material-darker",
      readOnly: true
    });

    stderr.subscribe(o => stderrEditor.setValue(o));
  });

  let toggle = () => {
    console.log("tuggli");
    visible.set(!$visible);
  };
</script>

<style>
  section {
    display: flex;
    flex-direction: column;
    font-family: monospace;
    transition: all 0.3s;
    overflow: hidden;
  }

  header {
    border-top: 1px solid var(--border-color);
    display: flex;
    flex: 0 0 30px;
    padding: 0 10px;
  }

  button {
    flex: 1;
    border: 0;
    padding: 0;
    height: 100%;
    background-color: inherit;
    color: var(--icon-color);
    font-size: 18px;
    position: relative;
    cursor: pointer;
  }

  button:after {
    content: "▴";
    font-size: 24px;
    position: absolute;
    top: 0;
    right: 0;
  }

  button:hover {
    color: var(--fg-color);
  }

  button.open {
    transform: rotate(180deg);
  }

  button.open:after {
    left: 0;
    right: initial;
  }

  .editors {
    padding: 0 20px;
    margin-top: 10px;
    display: flex;
    position: relative;
  }

  .editors.visible {
    flex: 1;
  }

  .stdout,
  .stderr {
    flex: 1;
  }

  .stdout {
    border-right: 1px solid var(--border-color);
  }

  .editors span {
    position: absolute;
    bottom: 10px;
    color: var(--inactive-color);
    font-size: 12px;
  }

  .editors span:nth-of-type(1) {
    left: 10px;
  }

  .editors span:nth-of-type(2) {
    left: calc(50% + 10px);
  }
</style>

<section style="flex: 0 0 {$visible ? 300 : 30}px;">
  <header>
    <Tab active={$visible} on:click={toggle}>Output</Tab>
    <button class:open={$visible} on:click={toggle} />
  </header>

  <div class="editors" class:visible={$visible}>
    <div class="stdout" />
    <div class="stderr" />
    <span>stdout</span>
    <span>stderr</span>
  </div>
</section>

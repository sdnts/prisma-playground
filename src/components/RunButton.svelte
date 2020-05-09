<script>
  import consoleStore from "../stores/console";

  let run = () => {
    console.log("Running");
    consoleStore.setValue("[]");
    consoleStore.show();
  };
</script>

<style>
  button {
    position: fixed;
    top: 40px;
    right: 60px;
    width: 48px;
    height: 48px;
    border: 0;
    border-radius: 50%;
    z-index: 9999;
    cursor: pointer;
    background: #6eeb83;
    transition: all 0.5s;
  }

  button:after {
    content: "ᐈ";
    font-size: 24px;
    color: #353535;
  }

  button:hover {
    box-shadow: 20px 20px 60px #151515, -20px -20px 60px #555555;
  }
</style>

<button on:click={run} title="Run Code" />

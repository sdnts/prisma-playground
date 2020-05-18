const child_process = require("child_process");
const path = require("path");

const exec = (command, options) =>
  new Promise((resolve, reject) =>
    child_process.exec(command, options, (err, stdout, stderr) =>
      err ? reject(stderr) : resolve(stdout)
    )
  );

(async () => {
  try {
    const output = path.resolve(__dirname, "../archive");

    await exec(`rm -rf archive`);
    console.log("✅ Cleaned up old attempts");

    await exec(`mkdir -p archive`);
    await exec(`cp -R src/index.js archive`);
    await exec(`cp -R node_modules archive`);

    console.log("✅ Generated archive");

    await exec("zip -r archive.zip .", { cwd: output });
    await exec("mv archive.zip ..", { cwd: output });
    console.log("✅ Zipped archive");

    await exec(
      [
        "aws lambda update-function-code",
        "--function-name API__prisma-playground__reaper",
        "--zip-file fileb://archive.zip",
      ].join(" ")
    );
    console.log("✅ Uploaded archive to Lambda");
  } catch (e) {
    console.error("❌ Deploy failed: ", e);
    process.exit(1);
  }
})();

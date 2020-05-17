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
    await exec(`rm -rf __sapper__`);
    console.log("✅ Cleaned up old attempts");

    await exec(`npm run build`);
    console.log("✅ Built Sapper app");

    await exec(`mkdir -p archive`);
    await exec(`cp -R node_modules archive`);
    await exec(`cp -R __sapper__ archive`);
    await exec(`cp -R static archive`);
    await exec(`cp -R src/index.js archive`);
    console.log("✅ Generated archive");

    await exec("zip -r archive.zip .", { cwd: output });
    await exec("mv archive.zip ..", { cwd: output });
    console.log("✅ Zipped archive");

    await exec(
      [
        "aws lambda update-function-code",
        "--function-name Frontend__prisma-playground",
        "--zip-file fileb://archive.zip",
      ].join(" ")
    );
    console.log("✅ Uploaded archive to Lambda");
  } catch (e) {
    console.error("❌ Deploy failed: ", e);
    process.exit(1);
  }
})();

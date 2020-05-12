const path = require("path");
const fs = require("fs").promises;
const child_process = require("child_process");

function exec(command, options) {
  return new Promise((res, rej) =>
    child_process.exec(command, options, (error, stdout) => {
      if (error) {
        return rej(error);
      }
      return res(stdout);
    })
  );
}

async function main() {
  // We're going through all these hoops for two reasons:
  // 1. To highly optimize the Lambda package's size
  // 2.To ensure that the correct query-engine and migration-engine binaries exist in the package

  const input = path.resolve(__dirname, "..");
  const output = path.resolve(__dirname, "../archive");

  // Delete any old archives (from previous attempts) if they exist
  await exec("rm -rf archive", { cwd: input });
  await exec("rm -rf archive.zip", { cwd: input });

  // Create a new (temporary) directory that will contain our archive files
  await exec("mkdir archive", { cwd: input });

  // Copy all source files used in the lambda function to this directory
  await exec("cp -R *.js archive", { cwd: input, shell: true });
  await exec("cp -R prisma/schema.prisma archive", { cwd: input, shell: true });

  // Generate an npm project in the directory and install relevant packages
  await exec('echo "{}" > package.json', { cwd: output });
  await exec("npm install @prisma/cli @prisma/client", { cwd: output });

  // Remove unnecessary files from the archive
  await exec(
    [
      "rm -rf",
      // @prisma/client
      "node_modules/@prisma/client/*.d.ts",
      "node_modules/@prisma/client/*.md",
      "node_modules/@prisma/client/generator-build",
      "node_modules/@prisma/client/runtime",
      "node_modules/@prisma/client/scripts",
      "node_modules/.prisma/client/*.d.ts",
      // @prisma/cli
      "node_modules/@prisma/cli/build/public",
      "node_modules/@prisma/cli/build/xdg-open",
      "node_modules/@prisma/cli/download-build",
      "node_modules/@prisma/cli/preinstall",
      "node_modules/@prisma/cli/prisma-client",
      "node_modules/@prisma/cli/*.md",
      // Remove all engines too, we'll manually download the correct ones
      "node_modules/@prisma/cli/introspection-*",
      "node_modules/@prisma/cli/migration-*",
      "node_modules/@prisma/cli/prisma-*",
      "node_modules/@prisma/cli/query-*",
      "node_modules/.prisma/client/query-*",
    ].join(" "),
    {
      cwd: output,
      shell: true,
    }
  );

  // Manually download all required binaries for rhel-openssl-1.0.x (Lambda runtime)
  const binaryVersion = JSON.parse(
    await exec("cat node_modules/@prisma/cli/package.json", { cwd: output }) // aws-sdk is already in the Lambda runtime
  ).prisma.version;
  const queryEngineUrl = `https://prisma-builds.s3-eu-west-1.amazonaws.com/master/${binaryVersion}/rhel-openssl-1.0.x/query-engine.gz`;
  const migrationEngineUrl = `https://prisma-builds.s3-eu-west-1.amazonaws.com/master/${binaryVersion}/rhel-openssl-1.0.x/migration-engine.gz`;

  await exec(`curl ${queryEngineUrl} > query-engine.gz`, { cwd: output });
  await exec(`curl ${migrationEngineUrl} > migration-engine.gz`, {
    cwd: output,
  });

  // Unzip them
  await exec("gunzip query-engine.gz", { cwd: output });
  await exec("gunzip migration-engine.gz", { cwd: output });

  // Give them execute permissions
  await exec("chmod +x query-engine", { cwd: output });
  await exec("chmod +x migration-engine", { cwd: output });

  // Move them to their correct locations (& rename)
  await exec(
    "cp query-engine node_modules/@prisma/cli/query-engine-rhel-openssl-1.0.x",
    { cwd: output }
  );
  await exec(
    "mv query-engine node_modules/.prisma/client/query-engine-rhel-openssl-1.0.x",
    { cwd: output }
  );
  await exec(
    "mv migration-engine node_modules/@prisma/cli/migration-engine-rhel-openssl-1.0.x",
    { cwd: output }
  );

  // Zip it all up
  await exec("zip -r archive.zip .", { cwd: output });
  await exec("mv archive.zip ..", { cwd: output });

  // Remove the temporary directory
  await exec("rm -rf archive", { cwd: input });

  // Upload the archive to Lambda
  await exec(
    [
      "aws lambda update-function-code",
      "--function-name PrismaPlaygroundWorkspace",
      "--zip-file fileb://archive.zip",
    ].join(" ")
  );
}

main().catch((e) => {
  console.error("Error in script: ", e);
});

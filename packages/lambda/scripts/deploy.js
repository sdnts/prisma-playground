const path = require("path");
const fs = require("fs").promises;
const exec = require("../exec");

async function main() {
  // We're going through all these hoops for two reasons:
  // 1. To highly optimize the Lambda package's size (although there's still room for improvement)
  // 2. To ensure that the correct query-engine and migration-engine binaries exist in the package

  const input = path.resolve(__dirname, "..");
  const output = path.resolve(__dirname, "../archive");

  // Delete any old archives (from previous attempts) if they exist
  await exec("rm -rf archive", { cwd: input });
  await exec("rm -rf archive.zip", { cwd: input });
  console.log("✅ Cleaned up old attempts");

  // Create a new (temporary) directory that will contain our archive files
  await exec("mkdir archive", { cwd: input });
  console.log("✅ Created a temporary directory");

  // Copy all source files used in the lambda function to this directory
  await exec("cp -R *.js archive", { cwd: input, shell: true });
  await exec("cp -R prisma/schema.prisma archive", { cwd: input, shell: true });
  console.log("✅ Copied necessary files to directory");

  // Generate an npm project in the directory and install relevant packages
  await exec('echo "{}" > package.json', { cwd: output });
  await exec("npm install @prisma/cli @prisma/client uuid", { cwd: output });
  console.log("✅ Installed dependencies to directory");

  // Remove unnecessary files from the archive
  await exec(
    [
      "rm -rf",
      // @prisma/client
      "node_modules/@prisma/client/*.d.ts",
      "node_modules/@prisma/client/*.md",
      "node_modules/@prisma/client/generator-build",
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
  console.log("✅ Removed unnecessary files from directory");

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
  console.log("✅ Downloaded Prisma binaries");

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
  console.log("✅ Moved Prisma Binaries to expected locations");

  // Zip it all up
  await exec("zip -r archive.zip .", { cwd: output });
  await exec("mv archive.zip ..", { cwd: output });
  console.log("✅ Created archive for Lambda");

  // Upload the archive to Lambda
  await exec(
    [
      "aws lambda update-function-code",
      "--function-name PrismaPlaygroundWorkspace",
      "--zip-file fileb://archive.zip",
    ].join(" ")
  );
  console.log("✅ Uploaded archive to Lambda");
}

main().catch((e) => {
  console.error("❌ Deployment failed:", e);
  process.exit(1);
});

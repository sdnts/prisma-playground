const fs = require("fs").promises;
const exec = require("../exec");

async function main() {
  // try to delete a previous archive if it exists
  try {
    if (await fs.stat("archive.zip")) {
      await exec("rm -rf archive.zip");
    }
  } catch (e) {
    if (e.code !== "ENOENT") {
      throw e;
    }
  }

  // Remove any downloaded Prisma binaries

  await exec("zip", [
    "-r",
    "archive.zip",
    ".",
    "-x",
    '"**/*.d.ts"',
    "-x",
    '"**/*.md"',
    "-x",
    '"**/*.txt"',
    "-x",
    '"**/LICENSE"',
    "-x",
    '"prisma/**/*"',
    "-x",
    '"__tests__/**/*"',
    "-x",
    '"scripts/**/*"',
  ]);

  await exec("aws", [
    "lambda",
    "update-function-code",
    "--function-name",
    "PrismaPlaygroundWorkspace",
    "--zip-file",
    "fileb://archive.zip",
  ]);

  // await exec("rm -rf archive.zip");
}

main().catch((e) => {
  console.error(e);
});

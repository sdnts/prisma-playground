const { v4: uuid } = require("uuid");
const { PrismaClient } = require("@prisma/client");

const exec = require("./utils/exec");
const uploadDir = require("./utils/uploadDir");
const { DEFAULT_SCHEMA, DEFAULT_CODE } = require("./constants");

module.exports = async function post() {
  process.env.DEBUG && console.log("[post] Received request: ", { event });

  const workspaceId = uuid();
  const workspaceDbUrl = `${process.env.WORKSPACE_DB_URL}/${workspaceId}`;
  const workspaceSchema = DEFAULT_SCHEMA;
  const workspaceCode = DEFAULT_CODE;
  const tmpDirectory = `/tmp/${workspaceId}`;

  // First, set up a Prisma project at tmpDirectory
  await exec(`mkdir ${tmpDirectory}`);
  await exec(
    `cat <<EOF > ${tmpDirectory}/schema.prisma \n${workspaceSchema}\nEOF`
  );
  await exec(`mkdir node_modules`, { cwd: tmpDirectory });
  await exec(`cp -R node_modules/@prisma ${tmpDirectory}/node_modules`);
  await exec(`ln -sf node_modules/@prisma/cli/build/index.js ./prisma`, {
    cwd: tmpDirectory,
  }); // Create a symlink for easy invocation
  console.log(`✅ Set up Prisma project in ${tmpDirectory}`);

  // Then, provision a database & run an initial migration to get it to the correct state
  try {
    await exec(
      [
        "./prisma migrate save --experimental",
        "--create-db",
        '--name "Initial"',
      ].join(" "),
      {
        debug: true,
        cwd: tmpDirectory,
        env: {
          ...process.env,
          DB_URL: workspaceDbUrl,
        },
      }
    );
  } catch (e) {
    // Migrate tries to do something to the user's home directory, which fails on Lambda, so it throws. Ignore it.
  }

  try {
    await exec("./prisma migrate up --experimental", {
      debug: true,
      cwd: tmpDirectory,
      env: {
        ...process.env,
        DB_URL: workspaceDbUrl,
      },
    });
  } catch (e) {
    // Migrate tries to do something to the user's home directory, which fails on Lambda, so it throws. Ignore it.
  }

  console.log(`✅ Provisioned & set up database for workspace ${workspaceId}`);

  try {
    // Generate Prisma Client for the workspace
    await exec("./prisma generate", {
      cwd: tmpDirectory,
      env: {
        ...process.env,
        DB_URL: workspaceDbUrl,
      },
    });
    console.log("PRISMA GENERATE");
  } catch (e) {
    // Client Generate tries to do something to the user's home directory, which fails on Lambda, so it throws. Ignore it.
  }

  console.log(`✅ Generated Prisma Client for workspace ${workspaceId}`);

  // Clean up `tmpDirectory` directory by removing unnecessary files
  await exec(
    [
      "rm -rf",
      // prisma symlink
      "prisma",
      // @prisma/client
      "node_modules/@prisma/client/*.d.ts",
      "node_modules/@prisma/client/*.md",
      "node_modules/@prisma/client/generator-build",
      "node_modules/@prisma/client/runtime/*.d.ts",
      "node_modules/@prisma/client/runtime/*.map",
      "node_modules/@prisma/client/runtime/highlight",
      "node_modules/@prisma/client/runtime/utils",
      "node_modules/@prisma/client/scripts",
      // .prisma/client
      "node_modules/.prisma/client/*.d.ts",
      "node_modules/.prisma/client/runtime/*.d.ts",
      "node_modules/.prisma/client/runtime/*.map",
      "node_modules/.prisma/client/runtime/highlight",
      "node_modules/.prisma/client/runtime/utils",
    ].join(" "),
    { shell: true, cwd: tmpDirectory }
  );
  console.log(`✅ Removed unnecessary files from ${tmpDirectory}`);

  // Upload `tmpDirectory` directory to S3 for storage
  await uploadDir(tmpDirectory);
  console.log(`✅ Uploaded relevant files to S3 from ${workspaceId}`);

  const prisma = new PrismaClient();
  // Then, create the workspace
  const workspace = await prisma.workspace.create({
    data: {
      id: workspaceId,
      schema: workspaceSchema,
      code: workspaceCode,
    },
  });
  await prisma.disconnect();
  console.log(`✅ Created workspace ${workspaceId}`);

  // And send it back
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ error: null, workspace }),
  };
};

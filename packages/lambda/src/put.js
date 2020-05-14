const { PrismaClient } = require("@prisma/client");

const downloadDir = require("./utils/downloadDir");
const uploadDir = require("./utils/uploadDir");

module.exports = async function put(event) {
  process.env.DEBUG && console.log("[put] Received request: ", { event });

  const { id } = event.pathParameters || {};
  if (!id) {
    process.env.DEBUG && console.log(`❌[put] Invalid id: ${id}, bad request`);
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: "Bad Request",
        workspace: null,
        output: null,
      }),
    };
  }

  const prisma = new PrismaClient();
  const workspace = await prisma.workspace.findOne({ where: { id } });
  if (!workspace) {
    process.env.DEBUG &&
      console.log(`❌[put] Unable to find workspace with id: ${id}`);
    return {
      statusCode: 404,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: "Workspace not found",
        workspace: null,
        output: null,
      }),
    };
  }

  const { schema, code } = JSON.parse(event.body);
  if (!schema && !code) {
    process.env.DEBUG && console.log(`✅[put] No changes requested`);
    return {
      statusCode: 200,
      error: null,
      workspace,
      output: null,
    };
  }

  const tmpDirectory = `/tmp/${id}`;
  const workspaceDbUrl = `${process.env.WORKSPACE_DB_URL}/${workspace.id}`;

  // Copy over this workspace's file system from S3
  await downloadDir(`workspace/${id}`);
  process.env.DEBUG &&
    console.log(`✅[put] Downloaded relevant files from S3 to ${tmpDirectory}`);

  let output = "";

  if (workspace.schema !== schema) {
    await exec(`ln -sf node_modules/@prisma/cli/build/index.js ./prisma`, {
      cwd: tmpDirectory,
    }); // Create a symlink for easy invocation

    // Migrate
    try {
      await exec(
        [
          "./prisma migrate save --experimental",
          "--create-db",
          '--name ""',
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
    process.env.DEBUG && console.log(`✅[put] Migrate save complete`);

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
    console.log(`✅[put] Migrate up complete`);

    // Generate
    try {
      // Generate Prisma Client for the workspace
      await exec("./prisma generate", {
        cwd: tmpDirectory,
        env: {
          ...process.env,
          DB_URL: workspaceDbUrl,
        },
      });
    } catch (e) {
      // Client Generate tries to do something to the user's home directory, which fails on Lambda, so it throws. Ignore it.
    }
    console.log(`✅[put] Client generation complete`);

    // Upload all changes to S3 again
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
    console.log(`✅[put] Removed unnecessary files from ${tmpDirectory}`);

    // Upload `tmpDirectory` directory to S3 for storage
    await uploadDir(tmpDirectory);
    console.log(`✅[put] Uploaded relevant files to S3 from ${tmpDirectory}`);

    output = "Migration Complete";
  }

  if (workspace.code !== code) {
    // Run code
    output = "Running Code";
  }

  // And update the workspace
  const updatedWorkspace = await prisma.workspace.update({
    where: { id },
    data: {
      code,
      schema,
    },
  });
  await prisma.disconnect();

  return {
    statusCode: 200,
    body: JSON.stringify({
      error: null,
      workspace: updatedWorkspace,
      output,
    }),
  };
};

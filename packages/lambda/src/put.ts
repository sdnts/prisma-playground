import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import { PrismaClient } from "@prisma/client";
import exec from "./utils/exec";

import downloadDir from "./utils/downloadDir";
import uploadDir from "./utils/uploadDir";
import runJS from "./utils/runJS";

/**
 * Handles PUT requests to this Lambda
 *
 * @param event API Gateway Proxy Event
 */
export default async function put(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
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

  const { schema, code } = JSON.parse(event.body || "{}");
  if (!schema && !code) {
    process.env.DEBUG && console.log(`✅[put] No changes requested`);
    return {
      statusCode: 200,
      body: JSON.stringify({
        error: null,
        workspace,
        output: null,
      }),
    };
  }

  const tmpDirectory = `/tmp/${id}`;
  const workspaceDbUrl = `${process.env.WORKSPACE_DB_URL}/${id}`;

  // Copy over this workspace's file system from S3
  await downloadDir(`workspace/${id}`);
  process.env.DEBUG &&
    console.log(`✅[put] Downloaded relevant files from S3 in ${tmpDirectory}`);

  let output = "";

  // If the schema has changed, migrate up!
  if (schema && workspace.schema !== schema) {
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
        cwd: tmpDirectory,
        env: {
          ...process.env,
          DB_URL: workspaceDbUrl,
        },
      });
    } catch (e) {
      // Migrate tries to do something to the user's home directory, which fails on Lambda, so it throws. Ignore it.
    }
    process.env.DEBUG && console.log(`✅[put] Migrate up complete`);

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
    process.env.DEBUG && console.log(`✅[put] Client generation complete`);

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
      { shell: "/bin/sh", cwd: tmpDirectory }
    );
    process.env.DEBUG &&
      console.log(`✅[put] Removed unnecessary files from ${tmpDirectory}`);

    // Upload `tmpDirectory` directory to S3 for storage
    await uploadDir(tmpDirectory);
    process.env.DEBUG &&
      console.log(`✅[put] Uploaded relevant files to S3 from ${tmpDirectory}`);

    output = "Migration Complete";
  }

  // Run code
  output = runJS(code, tmpDirectory);
  process.env.DEBUG && console.log(`✅[put] Code run. stdout: ${output}`);

  // And update the workspace
  const updatedWorkspace = await prisma.workspace.update({
    where: { id },
    data: {
      code,
      schema,
    },
  });
  await prisma.disconnect();
  process.env.DEBUG && console.log(`✅[put] Workspace ${id} updated`);

  return {
    statusCode: 200,
    body: JSON.stringify({
      error: null,
      workspace: updatedWorkspace,
      output,
    }),
  };
}

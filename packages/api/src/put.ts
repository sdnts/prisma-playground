import path from "path";
import { PrismaClient } from "@prisma/client";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

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
  process.env.DEBUG &&
    console.log("[put] Received request: ", {
      event,
    });

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

  // Prisma Binaries are not part of the S3 workspace, so override the "expected" location with the ones in the Lambda archive
  process.env.PRISMA_QUERY_ENGINE_BINARY = path.resolve(
    require.resolve("@prisma/cli"),
    `../../query-engine-${process.env.PRISMA_BINARY_PLATFORM}`
  );
  process.env.PRISMA_MIGRATION_ENGINE_BINARY = path.resolve(
    require.resolve("@prisma/cli"),
    `../../migration-engine-${process.env.PRISMA_BINARY_PLATFORM}`
  );

  // First, find the workspace we'll update
  const prisma = new PrismaClient();
  const workspace = await prisma.workspace.findOne({ where: { id } });
  if (!workspace) {
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
  // If neither schema nor code need changing, there's nothing to do
  if (!schema && !code) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        error: null,
        workspace,
        output: null,
      }),
    };
  }

  // Create a `tmpDirectory`, we will download this workspace's generated client + migration steps here (created during workspace creation in POST)
  const tmpDirectory = `/tmp/${id}`;
  const workspaceDbUrl = `${process.env.WORKSPACE_DB_URL}/${id}`;

  // Copy over this workspace's file system from S3
  await exec(`rm -rf ${tmpDirectory}`);
  await downloadDir(`workspace/${id}`);
  process.env.DEBUG &&
    console.log(`✅[put] Downloaded relevant files from S3 in ${tmpDirectory}`);

  // If the schema has changed, migrate up!
  if (schema && workspace.schema !== schema) {
    // Migrate
    try {
      await exec(
        [
          "node ./node_modules/@prisma/cli/build/index.js",
          "migrate save --experimental",
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

    try {
      await exec(
        [
          "node ./node_modules/@prisma/cli/build/index.js",
          "migrate up --experimental",
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
    process.env.DEBUG && console.log(`✅[put] Migration complete`);

    // And then generate Prisma Client for the workspace (since schema changed)
    try {
      await exec(
        ["node ./node_modules/@prisma/cli/build/index.js", "generate"].join(
          " "
        ),
        {
          cwd: tmpDirectory,
          env: {
            ...process.env,
            DB_URL: workspaceDbUrl,
          },
        }
      );
    } catch (e) {
      // Client Generate tries to do something to the user's home directory, which fails on Lambda, so it throws. Ignore it.
    }
    process.env.DEBUG && console.log(`✅[put] Client generation complete`);

    // Upload all changes to S3 again, since they've changed. Delete all extra files as in POST
    await exec(
      [
        "rm -rf",
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
        // @prisma/cli
        "node_modules/@prisma/cli/query-*",
        "node_modules/@prisma/cli/migration-*",
        "node_modules/@prisma/cli/introspection-*",
        "node_modules/@prisma/cli/prisma-fmt-*",
      ].join(" "),
      {
        shell: "/bin/sh",
        cwd: tmpDirectory,
      }
    );
    process.env.DEBUG &&
      console.log(`✅[put] Removed unnecessary files from ${tmpDirectory}`);

    // Upload `tmpDirectory` directory to S3 for storage
    await uploadDir(tmpDirectory);
    process.env.DEBUG &&
      console.log(`✅[put] Uploaded relevant files to S3 from ${tmpDirectory}`);
  }

  // If either code or schema changed, the code will need to be re-run.
  const output = await runJS(code, {
    workspace: { dir: tmpDirectory, dbUrl: workspaceDbUrl },
  });
  process.env.DEBUG && console.log(`✅[put] Code run. stdout: ${output}`);

  // And finally, update the workspace with the new code and schema (if changed)
  const updatedWorkspace = await prisma.workspace.update({
    where: { id },
    data: {
      code,
      schema,
      updatedAt: new Date().toISOString(),
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
}

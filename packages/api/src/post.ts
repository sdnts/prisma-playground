import path from "path";
import { v4 as uuid } from "uuid";
import { PrismaClient } from "@prisma/client";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import exec from "./utils/exec";
import uploadDir from "./utils/uploadDir";
import { DEFAULT_SCHEMA, DEFAULT_CODE } from "./constants";

/**
 * Handles POST requests to this Lambda
 *
 * @param event API Gateway Proxy Event
 */
export default async function post(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  process.env.DEBUG &&
    console.log("[post] Received request: ", {
      event,
    });

  const workspaceId = uuid();
  const workspaceDbUrl = `${process.env.WORKSPACE_DB_URL}/${workspaceId}`;
  const workspaceSchema = DEFAULT_SCHEMA;
  const workspaceCode = DEFAULT_CODE;
  const tmpDirectory = `/tmp/${workspaceId}`;

  // First, set up a Prisma project at tmpDirectory
  await exec(`mkdir ${tmpDirectory}`);
  await exec(
    `cat <<EOF > ${tmpDirectory}/schema.prisma \n${workspaceSchema}\nEOF`
  ); // Create the schema file
  await exec(`mkdir node_modules`, {
    cwd: tmpDirectory,
  });
  // Copy over @prisma/client and @prisma/cli from lambda's archive since they're the same.
  // This allows us to not do an `npm install` in `tmpDirectory`
  await exec(`cp -R node_modules/@prisma ${tmpDirectory}/node_modules`);

  // However, there are extra files that the lambda archive needs, but the "workspace" doesn't. Delete them.
  await exec(
    [
      "rm -rf",
      // @prisma/client
      "node_modules/@prisma/client/*.d.ts",
      "node_modules/@prisma/client/*.md",
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
    { shell: "/bin/sh", cwd: tmpDirectory }
  );
  console.log(`✅[post] Set up Prisma project in ${tmpDirectory}`);

  // Prisma Binaries are not part of the S3 workspace, so override the "expected" location with the ones in the Lambda archive
  process.env.PRISMA_QUERY_ENGINE_BINARY = path.resolve(
    require.resolve("@prisma/cli"),
    `../../query-engine-${process.env.PRISMA_BINARY_PLATFORM}`
  );
  process.env.PRISMA_MIGRATION_ENGINE_BINARY = path.resolve(
    require.resolve("@prisma/cli"),
    `../../migration-engine-${process.env.PRISMA_BINARY_PLATFORM}`
  );

  // Then, provision a database & run an initial migration to get it to the correct state
  try {
    await exec(
      [
        "node ./node_modules/@prisma/cli/build/index.js",
        "migrate save --experimental",
        "--create-db",
        "--auto-approve",
        "--force",
        '--name "Initial"',
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
        "--auto-approve",
        "--force",
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
  console.log(
    `✅[post] Provisioned & set up database for workspace ${workspaceId}`
  );

  // Generate Prisma Client for the workspace
  try {
    await exec(
      ["node ./node_modules/@prisma/cli/build/index.js", "generate"].join(" "),
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
  console.log(`✅[post] Generated Prisma Client for workspace ${workspaceId}`);

  // Upload `tmpDirectory` directory to S3 for storage (so that Client doesn't need to be generated over and over + to save migration steps on a file system)
  await uploadDir(tmpDirectory);
  console.log(`✅[post] Uploaded relevant files to S3 from ${workspaceId}`);

  // Then, create the workspace in our database's `Workspace` table
  const prisma = new PrismaClient();
  const workspace = await prisma.workspace.create({
    data: {
      id: workspaceId,
      schema: workspaceSchema,
      code: workspaceCode,
    },
  });
  await prisma.disconnect();
  console.log(`✅[post] Created workspace ${workspaceId}`);

  // And send it back
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      error: null,
      workspace,
    }),
  };
}

const fs = require("fs").promises;
const path = require("path");
const { v4: uuid } = require("uuid");
const aws = require("aws-sdk");
const { PrismaClient } = require("@prisma/client");

const exec = require("./exec");
const uploadDir = require("./uploadDir");

const {
  DEFAULT_SCHEMA,
  DEFAULT_CODE,
  LAMBDA_WRITABLE_LOCATION,
} = require("./constants");

aws.config.update({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_REGION,
});

const s3 = new aws.S3({
  apiVersion: "2006-03-01",
});
const prisma = new PrismaClient();

module.exports = async function post() {
  const workspaceId = uuid();
  const workspaceDbUrl = `${process.env.WORKSPACE_DB_URL}/${workspaceId}`;
  const workspaceSchema = DEFAULT_SCHEMA;
  const workspaceCode = DEFAULT_CODE;
  const tmpDirectory = `${LAMBDA_WRITABLE_LOCATION}/${workspaceId}`;

  // Prepare the `tmpDirectory` directory, then upload it all to S3

  // First, set up a Prisma project at tmpDirectory
  await fs.mkdir(tmpDirectory);
  await fs.writeFile(`${tmpDirectory}/schema.prisma`, workspaceSchema);

  // Then, provision a database & run an initial migration to get it to the correct state
  await exec(
    path.resolve(__dirname, "./node_modules/.bin/prisma"),
    ["migrate", "save", "--create-db", "--name", '"Initial"', "--experimental"],
    {
      cwd: tmpDirectory,
      env: {
        ...process.env,
        DB_URL: workspaceDbUrl,
      },
    }
  );
  await exec(
    path.resolve(__dirname, "./node_modules/.bin/prisma"),
    ["migrate", "up", "--experimental"],
    {
      cwd: tmpDirectory,
      env: {
        ...process.env,
        DB_URL: workspaceDbUrl,
      },
    }
  );

  try {
    // Generate Prisma Client for the workspace
    await exec(
      path.resolve(__dirname, "./node_modules/.bin/prisma"),
      ["generate"],
      {
        cwd: tmpDirectory,
        env: {
          ...process.env,
          DB_URL: workspaceDbUrl,
        },
      }
    );
  } catch (e) {
    // For some reason, `generate` throws an `npm` error, but generates correctly. Ignore it
    console.error(e);
  }

  // Clean up `tmpDirectory` directory by removing unnecessary files
  await exec(
    "rm",
    [
      "-rf",
      ".DS_Store",
      "node_modules/@prisma/client/*.d.ts",
      "node_modules/@prisma/client/*.md",
      "node_modules/@prisma/client/generator-build",
      "node_modules/@prisma/client/scripts",
    ],
    { shell: true, cwd: tmpDirectory }
  );

  // Upload `tmpDirectory` directory to S3 for storage
  await uploadDir(tmpDirectory, {
    s3,
    bucket: process.env.AWS_S3_BUCKET,
  });

  // Then, create the workspace
  const workspace = await prisma.workspace.create({
    data: {
      id: workspaceId,
      schema: workspaceSchema,
      code: workspaceCode,
    },
  });

  // And send it back
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ workspace }),
  };

  return {};
};

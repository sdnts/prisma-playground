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
  await exec(`mkdir ${tmpDirectory}`)
  await exec(`echo "${workspaceSchema}" > ${tmpDirectory}/schema.prisma`)
  await exec('echo "{}" > package.json');
  await exec("npm install @prisma/cli @prisma/client");
  console.log(`✅ Set up Prisma project in ${tmpDirectory}`);

  // Then, provision a database & run an initial migration to get it to the correct state
  try {
    console.log('MIGRATE UP')
    await exec(
      [
        "./node_modules/.bin/prisma migrate save --experimental",
        "--create-db",
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
    console.log('MIGRATE SAVE')
    await exec(
      "node_modules/.bin/prisma migrate up --experimental",
      {
        cwd: tmpDirectory,
        env: {
          ...process.env,
          DB_URL: workspaceDbUrl,
        },
      }
    );
    console.log(`✅ Provisioned & set up database for workspace ${workspaceId}`);
  } catch (e) {
    console.log('Error during migrate')
    console.log(e)
    console.log(e.message)
    console.log(e.stack)
    console.log(JSON.stringify(e))
    console.log(JSON.stringify(e.toString()))
    console.log(JSON.stringify(e.message))
    console.log(JSON.stringify(e.stack))
    throw e.toString()
  }

  try {
    // Generate Prisma Client for the workspace
    await exec(
      "node_modules/.bin/prisma generate",
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
    console.error("Error generating Prisma Client: ", e);
  }
  console.log(`✅ Generated Prisma Client for workspace ${workspaceId}`);

  // Clean up `tmpDirectory` directory by removing unnecessary files
  await exec(
    [
      "rm -rf",
      "node_modules/@prisma/client/*.d.ts",
      "node_modules/@prisma/client/*.md",
      "node_modules/@prisma/client/generator-build",
      "node_modules/.prisma/client/runtime/*.d.ts",
      "node_modules/.prisma/client/runtime/*.map",
      "node_modules/.prisma/client/runtime/highlight/*.d.ts",
      "node_modules/.prisma/client/runtime/utils/*.d.ts",
      "node_modules/@prisma/client/scripts",
    ].join(" "),
    { shell: true, cwd: tmpDirectory }
  );
  console.log(`✅ Removed unnecessary files from ${workspaceId}`);

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
};

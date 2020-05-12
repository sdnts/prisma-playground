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
  // const workspaceId = 'abcd';
  const workspaceDbUrl = `${process.env.WORKSPACE_DB_URL}/${workspaceId}`;
  const workspaceSchema = DEFAULT_SCHEMA;
  const workspaceCode = DEFAULT_CODE;
  const tmpDirectory = `${LAMBDA_WRITABLE_LOCATION}/${workspaceId}`;

  // Prepare the `tmpDirectory` directory, then upload it all to S3

  // First, set up a Prisma project at tmpDirectory
  await exec(`mkdir ${tmpDirectory}`)
  console.log('MKDIR')
  // await exec(`echo "${${tmpDirectory}/schema.prisma}" > ${tmpDirectory}/schema.prisma`)
  await exec(`cat <<EOF > ${tmpDirectory}/schema.prisma \n${workspaceSchema}\nEOF`)
  console.log('CREATE SCHEMA')
  await exec(`mkdir node_modules`, { cwd: tmpDirectory })
  console.log('CREATE NODE_MODULES')
  await exec(`cp -R node_modules/@prisma ${tmpDirectory}/node_modules`)
  console.log('COPY @PRISMA')
  await exec(`ln -sf node_modules/@prisma/cli/build/index.js ./prisma`, { cwd: tmpDirectory })
  console.log('CREATE SYMLINK')
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
        cwd: tmpDirectory,
        env: {
          ...process.env,
          DB_URL: workspaceDbUrl,
        },
      }
    );
    console.log('MIGRATE UP')
    await exec(
      "./prisma migrate up --experimental",
      {
        cwd: tmpDirectory,
        env: {
          ...process.env,
          DB_URL: workspaceDbUrl,
        },
      }
    );
    console.log('MIGRATE SAVE')
    console.log(`✅ Provisioned & set up database for workspace ${workspaceId}`);
  } catch (e) {
    console.log('Error during migrate', e)
    console.log(await exec('ls -a', { cwd: tmpDirectory }))
    await uploadDir(tmpDirectory, {
      s3,
      bucket: process.env.AWS_S3_BUCKET,
    });
    throw e.toString()
  }

  try {
    // Generate Prisma Client for the workspace
    await exec(
      "./prisma generate",
      {
        cwd: tmpDirectory,
        env: {
          ...process.env,
          DB_URL: workspaceDbUrl,
        },
      }
    );
    console.log('PRISMA GENERATE')
  } catch (e) {
    // For some reason, `generate` throws an `npm` error, but generates correctly. Ignore it
    console.error("Error generating Prisma Client: ", e);
  }
  console.log(`✅ Generated Prisma Client for workspace ${workspaceId}`);

  // Clean up `tmpDirectory` directory by removing unnecessary files
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

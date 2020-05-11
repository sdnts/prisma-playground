module.exports = async function put(event) {
  const { id, schema, code } = JSON.parse(event.body);

  const workspace = await prisma.workspace.update({
    where: { id },
    data: {
      schema,
      code,
    },
  });

  // Generate Prisma Client for this schema
  await exec(
    path.resolve(__dirname, "./node_modules/.bin/prisma"),
    ["generate"],
    {
      cwd: LAMBDA_WRITABLE_LOCATION,
      env: {
        ...process.env,
        DB_URL: workspaceDbUrl,
      },
    }
  );

  // And run it

  return {
    statusCode: 200,
    body: JSON.stringify({ workspace, output: "[]" }),
  };
};

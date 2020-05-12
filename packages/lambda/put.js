module.exports = async function put(event) {
  const { id, schema, code } = JSON.parse(event.body);

  const workspace = await prisma.workspace.update({
    where: { id },
    data: {
      schema,
      code,
    },
  });

  // Fetch this workspace from S3

  // And run saved code against it

  return {
    statusCode: 200,
    body: JSON.stringify({ workspace, output: "[]" }),
  };
};

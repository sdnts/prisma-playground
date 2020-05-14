const { PrismaClient } = require("@prisma/client");

module.exports = async function del(event) {
  process.env.DEBUG && console.log("[delete] Received request: ", { event });

  const { id } = event.pathParameters || {};
  if (!id) {
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
  const workspace = await prisma.workspace.delete({
    where: { id },
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ workspace }),
  };
};

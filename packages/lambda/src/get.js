const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = async function get(event) {
  const { id } = event.pathParameters || {};

  if (!id) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: "Bad Request", workspace: null }),
    };
  }

  const workspace = await prisma.workspace.findOne({ where: { id } });

  if (!workspace) {
    return {
      statusCode: 404,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: "Workspace not found", workspace: null }),
    };
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ error: null, workspace }),
  };
};

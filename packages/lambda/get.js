const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = async function get(event) {
  const { id } = event.queryStringParameters;

  const workspace = await prisma.workspace.findOne({ where: { id } });

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ workspace }),
  };
};

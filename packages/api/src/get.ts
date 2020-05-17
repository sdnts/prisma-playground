import path from "path";
import { PrismaClient } from "@prisma/client";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

/**
 * Handles GET requests to this Lambda
 *
 * @param event API Gateway Proxy Event
 */
export default async function get(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  process.env.DEBUG && console.log("✅[get] Received request: ", { event });

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

  process.env.PRISMA_QUERY_ENGINE_BINARY = path.resolve(
    require.resolve("@prisma/cli"),
    `../../query-engine-${process.env.PRISMA_BINARY_PLATFORM}`
  );

  const prisma = new PrismaClient();
  const workspace = await prisma.workspace.findOne({ where: { id } });
  await prisma.disconnect();

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
}

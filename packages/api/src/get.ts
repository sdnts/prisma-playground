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

  process.env.PRISMA_QUERY_ENGINE_BINARY = path.resolve(
    require.resolve("@prisma/cli"),
    `../../query-engine-${process.env.PRISMA_BINARY_PLATFORM}`
  );

  let workspace;
  const prisma = new PrismaClient();
  if (!id) {
    // If no specific workspace is fetched, return all workspaces that are more than a week old
    // Yeah this isn't the prettiest of designs lmao
    const today = new Date().getTime();
    const week = 7 * 24 * 60 * 60 * 1000;
    workspace = await prisma.workspace.findMany({
      where: { updatedAt: { lte: new Date(today - week).toISOString() } },
    });
  } else {
    workspace = await prisma.workspace.findOne({ where: { id } });
  }
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

import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { PrismaClient } from "@prisma/client";

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

  const prisma = new PrismaClient();
  const workspace = await prisma.workspace.findOne({ where: { id } });
  await prisma.disconnect();
  process.env.DEBUG && console.log(`✅[get] Found workspace with id ${id}`);

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

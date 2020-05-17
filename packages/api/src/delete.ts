import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { PrismaClient } from "@prisma/client";

/**
 * Handles DELETE requests to this Lambda
 *
 * @param event API Gateway Proxy Event
 */
export default async function del(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
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

  // TODO:: Delete this workspace from S3

  // Delete this workspace from our DB
  const prisma = new PrismaClient();
  const workspace = await prisma.workspace.delete({
    where: { id },
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ workspace }),
  };
}

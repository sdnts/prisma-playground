import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { PrismaClient } from "@prisma/client";

import deleteDir from "./utils/deleteDir";

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

  // The workpsace's DB is already deleted by Reaper, so we don't have to do it here

  // Delete this workspace from S3
  deleteDir(`/workspaces/${id}`);

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

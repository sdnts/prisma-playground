import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import get from "./get";
import post from "./post";
import put from "./put";
import del from "./delete";

export const handler = async function workspace(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  let response: APIGatewayProxyResult;

  try {
    switch (event.httpMethod) {
      case "GET":
        response = await get(event);
        break;
      case "POST":
        response = await post(event);
        break;
      case "PUT":
        response = await put(event);
        break;
      case "DELETE":
        response = await del(event);
        break;
      default:
        response = {
          statusCode: 400,
          body: JSON.stringify({ error: "Bad Request" }),
        };
    }

    return {
      ...response,
      headers: {
        ...response.headers,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      },
    };
  } catch (e) {
    return Promise.resolve({
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      },
      body: JSON.stringify({
        error: e.toString(),
        message: "Please contact me@madebysid.com",
      }),
    });
  }
};

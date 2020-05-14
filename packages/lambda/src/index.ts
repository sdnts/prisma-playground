import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import get from "./get";
import post from "./post";
import put from "./put";
import del from "./delete";

exports.handler = function workspace(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    switch (event.httpMethod) {
      case "GET":
        return get(event);
      case "POST":
        return post();
      case "PUT":
        return put(event);
      case "DELETE":
        return del(event);
      default:
        return Promise.resolve({
          statusCode: 400,
          body: JSON.stringify({ error: "Bad Request" }),
        });
    }
  } catch (e) {
    return Promise.resolve({
      statusCode: 500,
      body: JSON.stringify({
        error: e.toString(),
        message: "Please contact me@madebysid.com",
      }),
    });
  }
};

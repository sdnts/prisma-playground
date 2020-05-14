const options = require("./options");
const get = require("./get");
const post = require("./post");
const put = require("./put");
const del = require("./delete");

exports.handler = function workspace(event) {
  try {
    switch (event.httpMethod) {
      case "OPTIONS":
        return options(event);
      case "GET":
        return get(event);
      case "POST":
        return post(event);
      case "PUT":
        return put(event);
      case "DELETE":
        return del(event);
      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Bad Request" }),
        };
    }
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: e.toString(),
      }),
    };
  }
};

/**
 * Code that will be run on Lambda
 */

const serverless = require("serverless-http");
const app = require("./__sapper__/build/server/server");

process.env.NODE_ENV = process.env.NODE_ENV || "production";
process.env.PORT = process.env.PORT || 3000;

exports.handler = (event, context) => {
  console.log("Incoming Request: ", event);
  return serverless(app)(event, context);
};

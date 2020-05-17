/**
 * Code that will be run on Lambda
 */

const serverless = require("serverless-http");
const app = require("./__sapper__/build/server/server");

exports.handler = serverless(app);

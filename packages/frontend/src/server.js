import sirv from "sirv";
import express from "express";
import compression from "compression";
import * as sapper from "@sapper/server";

const { PORT, NODE_ENV } = process.env;
const dev = NODE_ENV === "development";

const server = express().use(
  // "/portable/dbs",
  compression({ threshold: 0 }),
  // sirv("static", { dev }),
  express.static("static"),
  sapper.middleware()
);

if (dev) {
  server.listen(PORT, (err) => {
    if (err) console.log("error", err);
  });
}

module.exports = server;

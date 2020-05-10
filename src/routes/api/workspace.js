import { v4 as uuid } from "uuid";
import { PrismaClient } from "@prisma/client";

import { DEFAULT_SCHEMA, DEFAULT_CODE } from "../../constants/defaults";

const prisma = new PrismaClient();

export async function get(req, res) {
  const { id } = req.query;

  const workspace = await prisma.workspace.findOne({ where: { id } });

  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(workspace));
}

export async function post(req, res) {
  const workspace = await prisma.workspace.create({
    data: {
      id: uuid(),
      schema: DEFAULT_SCHEMA,
      code: DEFAULT_CODE,
    },
  });
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(workspace));
}

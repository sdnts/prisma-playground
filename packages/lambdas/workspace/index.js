const { v4: uuid } = require("uuid");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
export const DEFAULT_SCHEMA = `
model User {
  id     Int     @id
  name   String
  posts  Post[]
}

model Post {
  id        Int  @id
  authorId  Int
  author    User  @relation(fields: [authorId], references: [id])
}
`.trim();

export const DEFAULT_CODE = `
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient();

const main = async () => {
  const users = await prisma.user.findMany();
  console.log(users);
}

main()
  .catch(e => console.log(e))
  .finally(() => prisma.disconnect())
`.trim();

async function get(event) {
  const { id } = event.queryStringParameters;

  const workspace = await prisma.workspace.findOne({ where: { id } });

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(workspace),
  };
}

async function post(event) {
  const workspace = await prisma.workspace.create({
    data: {
      id: uuid(),
      schema: DEFAULT_SCHEMA,
      code: DEFAULT_CODE,
    },
  });

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(workspace),
  };
}

async function put(event) {
  const { id, schema, code } = JSON.parse(event.body);

  return {
    statusCode: 200,
    body: JSON.stringify(`PUT Workspace ${id}`),
  };
}

async function del(event) {
  const { id } = JSON.parse(event.body);

  return {
    statusCode: 200,
    body: JSON.stringify(`DELETE Workspace, ${id}`),
  };
}

exports.handler = function workspace(event) {
  try {
    switch (event.httpMethod) {
      case "GET":
        return get(event);
      case "POST":
        return post(event);
      case "PUT":
        return put(event);
      case "DELETE":
        return del(event);
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error,
      }),
    };
  }
};

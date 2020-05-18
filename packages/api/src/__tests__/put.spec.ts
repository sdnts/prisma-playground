import { handler } from "../index";

const code = `
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const main = async () => {
  const users = await prisma.user.findMany();
  console.log(users);
}

main()
  .catch(e => console.log(e))
  .finally(() => prisma.disconnect())
`.trim();

describe("PUT /workspace/{id}", () => {
  it("can update a workspace's code", async () => {
    const invocation = await handler({
      httpMethod: "PUT",
      pathParameters: {
        id: "test",
      },
      body: JSON.stringify({
        schema: `
datasource db {
  provider = "postgres"
  url      = env("DB_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id     Int     @id @default(autoincrement())
  name   String
  email  String
  posts  Post[]
}

model Post {
  id        Int  @id
  authorId  Int
  author    User  @relation(fields: [authorId], references: [id])
}
        `.trim(),
      }),
    } as any);

    console.log("output: ", JSON.parse(invocation.body));
  });
});

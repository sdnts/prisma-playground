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
        id: "2a805473-7f6a-420d-bc22-e07d2559d27d",
      },
      body: JSON.stringify({
        code,
      }),
    } as any);

    expect(invocation).toHaveProperty("statusCode", 200);
    console.log("output: ", JSON.parse(invocation.body).output);

    expect(JSON.parse(invocation.body)).toHaveProperty("output", "output");
  });
});

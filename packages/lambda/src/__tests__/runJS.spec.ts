import path from "path";
import runJS from "../utils/runJS";

const workspaceId = "2a805473-7f6a-420d-bc22-e07d2559d27d";
const code = `
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const main = async () => {
  const users = await prisma.user.findMany();
  console.log(users);
  console.error('test')
}

main()
  .catch(e => console.log(e))
  .finally(() => prisma.disconnect())
`.trim();

describe("runJS", () => {
  beforeAll(() => {
    process.env.PRISMA_QUERY_ENGINE_BINARY = path.resolve(
      require.resolve("@prisma/cli"),
      `../../query-engine-darwin`
    );
  });

  it("can run untrusted code", async () => {
    const { stdout, stderr } = await runJS(code, {
      workspace: {
        dbUrl: `${process.env.WORKSPACE_DB_URL}/${workspaceId}`,
        dir: `/tmp/${workspaceId}`,
      },
    });
    expect(stdout).toEqual("[]\n");
    expect(stderr).toEqual("test\n");
  });
});

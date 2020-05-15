const fs = require("fs").promises;
const path = require("path");
const dotenv = require("dotenv");
const { handler: lambda } = require("../src/index");

(async () => {
  try {
    // Load environment variables from .env
    const env = dotenv.parse(
      await fs.readFile(path.resolve(__dirname, "../.env"))
    );

    process.env = {
      ...process.env,
      ...env,
    };

    const response = await lambda({
      httpMethod: "PUT",
      pathParameters: {
        id: "2a805473-7f6a-420d-bc22-e07d2559d27d",
      },
      body: JSON.stringify({
        code: `
        const { PrismaClient } = require('@prisma/client');

        console.log(PrismaClient)

        const prisma = new PrismaClient();

        const main = async () => {
          const users = await prisma.user.findMany();
          console.log(users);
        }

        main()
          .catch(e => console.log(e))
          .finally(() => prisma.disconnect())
      `.trim(),
      }),
    });

    console.log("Response: ", JSON.parse(response.body).output);
  } catch (e) {
    console.log("Lambda threw an exception: ", e.toString());
  }
})();

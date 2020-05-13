const fs = require("fs").promises;
const path = require("path");
const dotenv = require("dotenv");
const { handler: lambda } = require("../index");

const event = {
  httpMethod: "PUT",
  body: JSON.stringify({ id: "2a805473-7f6a-420d-bc22-e07d2559d27d" }),
};

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

    const response = await lambda(event);
    console.log("Response: ", JSON.stringify(response, null, 2));
  } catch (e) {
    console.log("Lambda threw an exception: ", e.toString());
  }
})();

const { handler } = require("../archive/index");

(async () => {
  try {
    const res = await handler({
      httpMethod: "GET",
      path: "/workspaces/2a805473-7f6a-420d-bc22-e07d2559d27d",
    });

    console.log("Response: ", res);
  } catch (e) {
    console.log("Error: ", e);
  }
})();

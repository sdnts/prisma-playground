const { handler } = require("../archive/index");

(async () => {
  try {
    const res = await handler({
      httpMethod: "GET",
      path: "/client/%5Bid%5D.9ef5314b.js",
    });

    console.log("Response: ", res);
  } catch (e) {
    console.log("Error: ", e);
  }
})();

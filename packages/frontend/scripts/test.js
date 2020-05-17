const { handler } = require("../archive/index");

(async () => {
  try {
    const res = await handler({
      httpMethod: "GET",
      path: "/client/[id].78f2886e.js",
    });

    console.log(res);
  } catch (e) {
    console.log("Error: ", e);
  }
})();

const { handler } = require("../src/index");

(async () => {
  const response = await handler();
  console.log(response);
})();

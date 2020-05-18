const { handler } = require("../archive/index");

(async () => {
  const response = await handler();
  console.log(response);
})();

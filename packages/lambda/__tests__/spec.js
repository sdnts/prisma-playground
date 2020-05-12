const { handler: lambda } = require("../index");

const event = {
  httpMethod: "POST",
};

(async () => {
  try {
    const response = await lambda(event);
    console.log("Response: ", JSON.stringify(response, null, 2));
  } catch (e) {
    console.log("Lambda threw an exception: ", e.toString());
  }
})();

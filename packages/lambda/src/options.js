const ALLOWED_ORIGINS = ["http://localhost:3000", "https://dietcode.io"];

module.exports = async function options() {
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "http://localhost:3000",
    },
    body: JSON.stringify(event),
  };
};

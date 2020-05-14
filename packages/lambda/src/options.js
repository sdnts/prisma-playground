const ALLOWED_ORIGINS = ["http://localhost:3000", "https://dietcode.io"];

module.exports = async function options() {
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS, GET, POST, PUT, DELETE",
      "Access-Control-Allow-Headers": "Content-Type",
    },
    body: "",
  };
};

exports.handler = function execute(event) {
  return {
    statusCode: 200,
    body: JSON.stringify("/prisma"),
  };
};

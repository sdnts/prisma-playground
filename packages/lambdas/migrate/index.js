exports.handler = function migrate(event) {
  return {
    statusCode: 200,
    body: JSON.stringify("/prisma"),
  };
};

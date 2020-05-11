module.exports = async function del(event) {
  const { id } = JSON.parse(event.body);

  const workspace = await prisma.workspace.delete({
    where: { id },
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ workspace }),
  };
};

const fetch = require("node-fetch");
// I'm sorry Prisma, I need to drop a DB and you can't do that
const { Client } = require("pg");

exports.handler = async (event) => {
  let response = "";
  const { error, workspace } = await fetch(
    "https://prisma-playground.sidmak.es/workspaces"
  ).then((res) => res.json());

  if (error) {
    return {
      statusCode: 500,
      body: "Internal server error",
    };
  }

  const pg = new Client();
  await pg.connect();

  for (const w of workspace) {
    await fetch(`https://prisma-playground.sidmak.es/workspaces/${w.id}`, {
      method: "DELETE",
    });
    await pg.query(`DROP DATABASE ${w.id}`);
  }
  await client.end();

  return {
    statusCode: 200,
    workspace,
  };
};

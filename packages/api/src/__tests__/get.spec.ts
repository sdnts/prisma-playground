const { handler } = require("../index");

describe("GET /workspace/{id}", () => {
  it("can get a workspace", async () => {
    const invocation = await handler({
      httpMethod: "GET",
      pathParameters: {
        id: "unit-test",
      },
    });

    expect(invocation).toHaveProperty("statusCode", 200);

    expect(invocation).toHaveProperty("body");
    expect(JSON.parse(invocation.body)).toHaveProperty("error", null);
    expect(JSON.parse(invocation.body)).toHaveProperty(
      "workspace.id",
      "unit-test"
    );
    expect(JSON.parse(invocation.body)).toHaveProperty(
      "workspace.schema",
      "schema"
    );
    expect(JSON.parse(invocation.body)).toHaveProperty(
      "workspace.code",
      "code"
    );
  });
});

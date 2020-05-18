import deleteDir from "../utils/deleteDir";

describe("deleteDir", () => {
  it("can delete a directory from S3", async () => {
    const response = await deleteDir("workspaces/bruh");
    console.log(response);
  });
});

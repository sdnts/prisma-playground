const fs = require("fs").promises;
const path = require("path");
const AWS = require("aws-sdk");

async function walk(dir) {
  const files = [];

  for (f of await fs.readdir(dir)) {
    const file = path.resolve(dir, f);
    const stat = await fs.stat(file);

    if (stat.isFile()) {
      files.push(file);
    } else if (stat.isDirectory()) {
      files.push(...(await walk(file)));
    }
  }

  return files;
}

module.exports = async function uploadDir(dir) {
  const s3 = new AWS.S3();
  const files = await walk(dir);
  process.env.DEBUG && console.log("[uploadDir] Uploading to S3: ", files);

  for (file of files) {
    await s3
      .putObject({
        Bucket: "prisma-playground",
        Key: file.replace("/tmp/", "workspace/"),
        Body: await fs.readFile(file),
      })
      .promise();
  }
};

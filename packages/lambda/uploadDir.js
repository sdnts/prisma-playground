const fs = require("fs").promises;
const path = require("path");

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

module.exports = async function uploadDir(dir, { s3, bucket }) {
  for (file of await walk(dir)) {
    await s3
      .putObject({
        Bucket: bucket,
        Key: file.replace("/tmp/", "workspace/"),
        Body: await fs.readFile(file),
      })
      .promise();
  }
};

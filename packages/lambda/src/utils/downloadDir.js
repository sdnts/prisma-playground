const fs = require("fs");
const path = require("path");
const AWS = require("aws-sdk");

const exec = require("./exec");

module.exports = async function downloadDir(dir) {
  const s3 = new AWS.S3();

  const files = (
    await s3
      .listObjects({
        Bucket: "prisma-playground",
        Prefix: dir,
      })
      .promise()
  ).Contents.map((o) => o.Key);

  for (const file of files) {
    const destination = file.replace("workspace/", "/tmp/");
    process.env.DEBUG &&
      console.log("[downloadDir] Downloading from S3: ", destination);

    await exec(`mkdir -p ${path.dirname(destination)}`);

    s3.getObject({
      Bucket: "prisma-playground",
      Key: file,
    })
      .createReadStream()
      .pipe(fs.createWriteStream(destination));
  }
};

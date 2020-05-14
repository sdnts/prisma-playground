import fs from "fs";
import path from "path";
import AWS from "aws-sdk";

import exec from "./exec";

/**
 * Downloads a workspace from S3's `prisma-playground/{dir}` key to `/tmp/`
 *
 * @param dir S3 Directory to download
 */
export default async function downloadDir(dir: string) {
  const s3 = new AWS.S3();

  const response = await s3
    .listObjects({
      Bucket: "prisma-playground",
      Prefix: dir,
    })
    .promise();

  if (!response.Contents) {
    throw new Error("Malformed response from S3");
  }

  const files = response.Contents.map((o) => o.Key!);

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
}

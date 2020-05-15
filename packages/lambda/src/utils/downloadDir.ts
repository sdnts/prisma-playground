import fs from "fs";
import stream from "stream";
import { promisify } from "util";
import path from "path";
import AWS from "aws-sdk";

import exec from "./exec";

const pipeline = promisify(stream.pipeline);

/**
 * Downloads a single file from the `prisma-playground` S3 bucket and places it in the `/tmp/` directory
 *
 * @param s3 AWS SDK S3 Instance
 * @param fileName Key of the file to download
 */
async function downloadFile(s3: AWS.S3, fileName: string): Promise<void> {
  const destination = fileName.replace("workspace/", "/tmp/");

  // Make sure the folder where the download is suppsoed to go exists
  await exec(`mkdir -p ${path.dirname(destination)}`);

  // Stream file from S3 to file system
  return pipeline(
    s3
      .getObject({
        Bucket: "prisma-playground",
        Key: fileName,
      })
      .createReadStream(),
    fs.createWriteStream(destination)
  );
}

/**
 * Downloads a directory (workspace) from the `prisma-playground` S3 bucket and places it in the `/tmp/` directory
 *
 * @param dir S3 Directory to download
 */
export default async function downloadDir(dir: string) {
  const s3 = new AWS.S3();

  // Get a  list of all files in this directory (workspace)
  const s3Objects = await s3
    .listObjects({
      Bucket: "prisma-playground",
      Prefix: dir,
    })
    .promise();

  if (!s3Objects.Contents) {
    throw new Error("Malformed response from S3");
  }

  const fileNames = s3Objects.Contents.map((o) => o.Key!);
  const downloads = []; // A list of file download promises. This ensures all downloads happen parallely

  for (const fileName of fileNames) {
    process.env.DEBUG &&
      console.log("[downloadDir] Downloading from S3: ", fileName);

    downloads.push(downloadFile(s3, fileName));
  }

  await Promise.all(downloads); // Wait for all downloads to finish before returning
}

import { promises as fs } from "fs";
import path from "path";
import AWS from "aws-sdk";

/**
 * Returns a list of all files in a directory
 *
 * @param dir Directory to scan
 */
async function walk(dir: string): Promise<string[]> {
  const files = [];

  for (const f of await fs.readdir(dir)) {
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

/**
 * Uploads a workspace from `/tmp` to S3's `prisma-playground/{dir}` key
 *
 * @param dir S3 Directory to upload
 */
export default async function uploadDir(dir: string) {
  const s3 = new AWS.S3();
  const files = await walk(dir);
  process.env.DEBUG && console.log("[uploadDir] Uploading to S3: ", files);

  for (const file of files) {
    await s3
      .putObject({
        Bucket: "prisma-playground",
        Key: file.replace("/tmp/", "workspace/"),
        Body: await fs.readFile(file),
      })
      .promise();
  }
}

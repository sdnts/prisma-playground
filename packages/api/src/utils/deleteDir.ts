import AWS from "aws-sdk";

/**
 * Deletes a directory (workspace) from the `prisma-playground` S3 bucket
 *
 * @param dir S3 Directory to delete
 */
export default async function downloadDir(dir: string) {
  const s3 = new AWS.S3();
  process.env.DEBUG && console.log("[deleteDir] Deleting from S3: ", dir);

  // Get a list of everything in this dir
  const s3Objects = await s3
    .listObjects({
      Bucket: "prisma-playground",
      Prefix: dir,
    })
    .promise();

  if (!s3Objects.Contents || s3Objects.Contents.length === 0) {
    return Promise.resolve();
  }

  // Delete the workspace at this key (this will also delete any subfolders)
  return s3
    .deleteObjects({
      Bucket: "prisma-playground",
      Delete: {
        Objects: s3Objects.Contents.map((c) => ({ Key: c.Key! })) || [],
      },
    })
    .promise();
}

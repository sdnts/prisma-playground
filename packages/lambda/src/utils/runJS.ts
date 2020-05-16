import { Worker } from "worker_threads";
import path from "path";

/**
 * Runs code in a workspace
 *
 * @param code The code to run
 * @param projectDir The directory (workspace) to run it in
 */
export default function runJS(
  code: string,
  projectDir: string
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    process.env.DEBUG &&
      console.log(
        "[runJS] PRISMA_QUERY_ENGINE_BINARY",
        process.env.PRISMA_QUERY_ENGINE_BINARY
      );
    const worker = new Worker(path.resolve(__dirname, "./sandbox.js"), {
      stdout: true,
      stderr: true,
      env: {
        PRISMA_QUERY_ENGINE_BINARY: process.env.PRISMA_QUERY_ENGINE_BINARY,
        DB_URL: process.env.DB_URL,
      },
      workerData: {
        code,
        projectDir,
      },
    });

    let stdout = "";
    let stderr = "";
    worker.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    worker.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    worker.on("exit", (code) => {
      if (code !== 0) {
        return reject(
          new Error(`[sandbox] Worker stopped with exit code ${code}`)
        );
      }

      return resolve({ stdout, stderr });
    });
  });
}

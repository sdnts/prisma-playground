import child_process from "child_process";

/**
 * Executes a shell command as a promise
 */
export default async function exec(
  command: string,
  options: child_process.ExecOptions = {}
): Promise<string> {
  return new Promise((resolve, reject) =>
    child_process.exec(command, options, (error, stdout, stderr) => {
      if (error) {
        process.env.DEBUG && console.log("[exec] An error occurred:", error);
        process.env.DEBUG && console.log("[exec] stderr:", stderr);
        process.env.DEBUG && console.log("[exec] stdout:", stdout);
        reject(error);
      }

      process.env.DEBUG && console.log("[exec] stdout:", stdout);
      return resolve(stdout);
    })
  );
}

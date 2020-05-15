/**
 * Runs code in a workspace
 *
 * @param code The code to run
 * @param projectDir The directory (workspace) to run it in
 */
export default function runJS(code: string, projectDir: string): string {
  // First, we need to override the environment that the code runs in, to disable arbitray imports.
  // This creates a semi-secure sandbpx.
  const env = {
    _stdout: "",

    require: function (moduleId: string): any {
      // Only allow @prisma/client imports
      if (moduleId !== "@prisma/client") {
        env._stdout += `"LMAO Nice try, you can only import "@prisma/client".`;
        return;
      }

      // Add the project's root the list of paths node will search when require-ing a module
      module.paths.push(projectDir);
      return require(`${projectDir}/node_modules/@prisma/client`);
    },

    console: {
      log: function (...args: any[]) {
        env._stdout += args.map((a) => JSON.stringify(a, null, 2)).join(", ");
        env._stdout += "\n";
        return;
      },
    },
  };

  // And run the code
  new Function(
    "env",
    `
      try {
        const { require, console } = env;
        ${code}
      }
      catch (e) {
        env._stdout += e.toString()
      }
    `
  )(env);

  return env._stdout;
}

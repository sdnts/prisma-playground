export default function runJS(code: string, projectDir: string): string {
  const env = {
    _stdout: "",

    require: function (moduleId: string): any {
      if (moduleId !== "@prisma/client") {
        env._stdout += `"LMAO Nice try, you can only import "@prisma/client".`;
        return;
      }

      module.paths.push(projectDir); // Add the project's root the list of paths node will search when require-ing a module
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

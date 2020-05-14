export default function runJS(code: string, projectDir: string): string {
  const env = {
    _stdout: "",

    require: function (module: string): any {
      if (module !== "@prisma/client") {
        env._stdout += `"LMAO Nice try, you can only import "@prisma/client".`;
        return;
      }

      return require(`${projectDir}/node_modules/@prisma/client`);
    },

    console: {
      log: function (...args: any[]) {
        env._stdout += args.map((a) => `"${String(a)}"`);
        return undefined;
      },
      error: function (...args: any[]) {
        env._stdout += args.map((a) => `"${String(a)}"`);
        return undefined;
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
        env._stderr += e.toString()
      }
    `
  )(env);

  return env._stdout;
}

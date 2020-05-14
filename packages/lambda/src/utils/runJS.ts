export default function runJS(code: string, projectDir: string): string {
  const env = {
    _stdout: "",

    require: function (module: string): any {
      if (module !== "@prisma/client") {
        env._stdout += `"LMAO Nice try, you can only import "@prisma/client".`;
        return;
      }

      process.env.DEBUG &&
        console.log(
          "Imported Prisma Client, returning: ",
          require(`${projectDir}/node_modules/@prisma/client`)
        );
      return require(`${projectDir}/node_modules/@prisma/client`);
    },

    console: {
      log: function (...args: any[]) {
        env._stdout += args
          .map((a) => {
            if (Array.isArray(a) || typeof a === "object") {
              return JSON.stringify(a);
            }
            return `"${String(a)}"`;
          })
          .join(", ");
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

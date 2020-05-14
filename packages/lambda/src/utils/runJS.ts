export default function runJS(code: string): string {
  const env = {
    _stdout: "",

    require: function () {
      env._stdout += "LMAO Nice try";
      return undefined;
    },

    console: {
      log: function (...args: any[]) {
        env._stdout += args.map((a) => String(a));
        return undefined;
      },
      error: function (...args: any[]) {
        env._stdout += args.map((a) => String(a));
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

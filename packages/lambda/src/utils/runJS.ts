export default function runJS(
  code: string
): { stdout: string; stderr: string } {
  const env = {
    _stdout: "",
    _stderr: "",

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
        env._stderr += args.map((a) => String(a));
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

  return {
    stdout: env._stdout,
    stderr: env._stderr,
  };
}

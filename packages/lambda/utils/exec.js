const child_process = require("child_process");

module.exports = async function exec(command, options = {}) {
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
};

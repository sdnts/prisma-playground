const { spawn } = require("child_process");

module.exports = async function exec(command, args, options) {
  return new Promise((resolve, reject) => {
    let p = spawn(command, args, options);
    let error = "";

    p.stderr.on("data", (e) => (error += e.toString()));
    p.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(error);
      }
    });
  });
};

const child_process = require("child_process");

module.exports = async function exec(command, options) {
  return new Promise((resolve, reject) =>
    child_process.exec(command, options, (error, stdout, stderr) => {
      if (error) {
        console.log('[exec] stderr:', stderr)
        reject(err)
      };
      return resolve(stdout);
    })
  );
};

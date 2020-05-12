const child_process = require("child_process");

module.exports = async function exec(command, options) {
  return new Promise((resolve, reject) =>
    child_process.exec(command, options, (error, stdout, stderr) => {
      if (error) {
        console.log('[exec] An error occurred:', error)
        console.log('[exec] stderr:', stderr)
        console.log('[exec] stdout:', stdout)
        reject(error)
      };

      console.log('[exec] stdout:', stdout)
      return resolve(stdout);
    })
  );
};

const child_process = require("child_process");

module.exports = async function exec(command, options) {
  return new Promise((resolve, reject) =>
    child_process.exec(command, options, (err, stdout, stderr) => {
      if (err) reject({ error, stderr });
      return resolve(stdout);
    })
  );
};

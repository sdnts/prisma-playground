/**
 * Sandboxed script that runs user code
 */

const { workerData } = require("worker_threads");

const { code, projectDir } = workerData;
const env = {
  require: function (moduleId) {
    // Only allow @prisma/client imports
    if (moduleId !== "@prisma/client") {
      throw new Error('LMAO Nice try, you can only import "@prisma/client".');
    }

    // Add the project's root to the list of paths node will search when require-ing a module
    module.paths.push(projectDir);
    return require(`${projectDir}/node_modules/@prisma/client`);
  },
};

new Function(
  "env",
  `
  try {
    const { require } = env;
    ${code}
  }
  catch (e) {
    console.log('Code threw an error: ', e.toString())
  }
  `
)(env);

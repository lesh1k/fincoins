const prepare = require('./prepare');
const migrate = require('./migrate');

async function fincoinsMigrate() {
  await prepare();
  await migrate();
}

module.exports = fincoinsMigrate;

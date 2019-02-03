
async function fincoinsMigrate() {
  const prepare = require('./prepare');
  await prepare();
  const migrate = require('./migrate');
  await migrate();
}

module.exports = fincoinsMigrate;

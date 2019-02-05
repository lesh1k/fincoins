const prepare = require('./prepare');
const migrate = require('./migrate');
const csv = require('./csv');

async function fincoinsMigrate() {
  await prepare();
  await migrate();
}

async function fincoinsCsv() {
  await prepare();
  await csv();
}

module.exports = {
  migrate: fincoinsMigrate,
  csv: fincoinsCsv,
};

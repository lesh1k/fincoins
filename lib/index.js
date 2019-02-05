const prepare = require('./prepare');
const migrate = require('./migrate');
const csv = require('./csv');
const dryRun = require('./dry-run');

async function fincoinsMigrate() {
  await prepare();
  await migrate();
}

async function fincoinsCsv() {
  await prepare();
  await csv();
}

async function fincoinsDryRun() {
  await prepare();
  await dryRun();
}

module.exports = {
  migrate: fincoinsMigrate,
  csv: fincoinsCsv,
  dryRun: fincoinsDryRun,
};

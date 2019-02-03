const fs = require('fs');

const CONFIG = require('../config');
const database = require('../db');
const insertAccounts = require('./accounts');
const insertTransactions = require('./transactions');
const insertTags = require('./tags');
const insertCategories = require('./categories');


async function migrate() {
  const dbPath = CONFIG.OUTPUT.BLUECOINS;
  await fs.promises.copyFile(CONFIG.INPUT.BLUECOINS, dbPath);
  database.setup(dbPath);
  await insertAccounts();
  await insertCategories();
  await insertTags();
  await insertTransactions();
  database.db.close();
}

module.exports = migrate;

const fs = require('fs');
const moment = require('moment');
const CONFIG = require('../config');
const ExchangeRates = require('../ExchangeRates');
const prepareAccounts = require('./accounts');
const prepareTags = require('./tags');
const prepareTransactions = require('./transactions');
const prepareCategories = require('./categories');

async function downloadExchangeRates(transactions) {
  const dates = transactions.map(t => (t.date)).sort((d1, d2) => d1 - d2);
  const startDate = moment(dates.shift()).format('YYYY-MM-DD');
  const endDate = moment(dates.pop()).format('YYYY-MM-DD');
  console.log(`Setting CONFIG.START_DATE to ${startDate}`);
  CONFIG.START_DATE = startDate;
  console.log(`Setting CONFIG.END_DATE to ${endDate}`);
  CONFIG.END_DATE = endDate;
  console.log(`Downloading historical exchange rates for ${CONFIG.BASE}. Period: ${startDate} - ${endDate}.`);
  await ExchangeRates.download(CONFIG.BASE, startDate, endDate);
  console.log('Done.');
}

async function prepare() {
  const json = JSON.parse(await fs.promises.readFile(CONFIG.PREPARE.FINANCIUS_BACKUP));
  await Promise.all([
    prepareAccounts(json),
    prepareTags(json),
    prepareCategories(json),
    prepareTransactions(json),
  ]);
  await downloadExchangeRates(json.transactions);
  console.log(`Copying financius data JSON to ${CONFIG.PREPARE.OUT.FINANCIUS}`);
  await fs.promises.copyFile(CONFIG.PREPARE.FINANCIUS_BACKUP, CONFIG.PREPARE.OUT.FINANCIUS);
  console.log(`Copying Bluecoins source DB to ${CONFIG.PREPARE.OUT.BLUECOINS}`);
  await fs.promises.copyFile(CONFIG.PREPARE.BLUECOINS_EMPTY_DB, CONFIG.PREPARE.OUT.BLUECOINS);
  console.log(`Copying Bluecoins CSV template to ${CONFIG.PREPARE.OUT.CSV}`);
  await fs.promises.copyFile(CONFIG.PREPARE.CSV_TEMPLATE, CONFIG.PREPARE.OUT.CSV);
  console.log('Preparation complete.');
}

module.exports = prepare;

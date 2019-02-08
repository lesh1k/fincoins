const fs = require('fs');
const moment = require('moment');
const CONFIG = require('../config');
const ExchangeRates = require('../ExchangeRates');
const prepareAccounts = require('./accounts');
const prepareTags = require('./tags');
const prepareTransactions = require('./transactions');
const prepareCategories = require('./categories');
const dryRun = require('../dry-run');

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

async function generateAdjustmentTransactions() {
  const preparedAccounts = JSON.parse(await fs.promises.readFile(CONFIG.PREPARE.OUT.ACCOUNTS));
  const dryRunResult = await dryRun();
  const adjustmentTransactions = dryRunResult.accounts.map((account) => {
    const referenceAccount = preparedAccounts.find(a => a.fin.id === account.id).fin;
    const expected = referenceAccount.balance;
    const actual = account.balance;
    const adjustment = expected - actual;
    const transaction = {
      fin: {
        id: `${Date.now()}-adjustment-${referenceAccount.title}`,
        account_from_id: null,
        account_to_id: null,
        category_id: null,
        tag_ids: [],
        date: moment(CONFIG.START_DATE).startOf('day').valueOf(),
        amount: Math.abs(adjustment),
        exchange_rate: 1,
        note: 'MIGRATION SCRIPT AMOUNT ADJUSTMENT',
        transaction_state: 1,
        transaction_type: null,
        include_in_reports: false,
        account_from_name: null,
        account_from_currency: null,
        account_to_name: null,
        account_to_currency: null,
        category_name: null,
        tag_names: [],
        isExpense: adjustment < 0,
        isIncome: adjustment >= 0,
        isTransfer: false,
      },
      bc: {},
    };

    const toOrFrom = adjustment < 0 ? 'from' : 'to';
    transaction.fin[`account_${toOrFrom}_id`] = referenceAccount.id;
    transaction.fin[`account_${toOrFrom}_name`] = referenceAccount.title;
    transaction.fin[`account_${toOrFrom}_currency`] = referenceAccount.currency_code;

    return transaction;
  }).filter(t => t.fin.amount);
  return adjustmentTransactions;
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
  const adjustmentTransactions = await generateAdjustmentTransactions();
  console.log('Applying accounts adjustment by adding extra transactions.');
  const preparedTransactions = JSON.parse(await fs.promises.readFile(CONFIG.PREPARE.OUT.TRANSACTIONS));
  await fs.promises.writeFile(CONFIG.PREPARE.OUT.TRANSACTIONS, JSON.stringify(preparedTransactions.concat(adjustmentTransactions), undefined, 2));
  console.log(`Copying financius data JSON to ${CONFIG.PREPARE.OUT.FINANCIUS}`);
  await fs.promises.copyFile(CONFIG.PREPARE.FINANCIUS_BACKUP, CONFIG.PREPARE.OUT.FINANCIUS);
  console.log(`Copying Bluecoins source DB to ${CONFIG.PREPARE.OUT.BLUECOINS}`);
  await fs.promises.copyFile(CONFIG.PREPARE.BLUECOINS_EMPTY_DB, CONFIG.PREPARE.OUT.BLUECOINS);
  console.log(`Copying Bluecoins CSV template to ${CONFIG.PREPARE.OUT.CSV}`);
  await fs.promises.copyFile(CONFIG.PREPARE.CSV_TEMPLATE, CONFIG.PREPARE.OUT.CSV);
  console.log('Preparation complete.');
}

module.exports = prepare;

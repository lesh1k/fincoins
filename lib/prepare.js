const fs = require('fs');
const moment = require('moment');
const CONFIG = require('./config');
const ExchangeRates = require('./ExchangeRates');

async function prepareAccounts(json) {
  console.log('Preparing accounts.');
  console.log(`Found ${json.accounts.length} accounts.`);
  const accounts = json.accounts.map((acc, i) => {
    const account = Object.assign({}, acc);
    delete account.sync_state;
    delete account.model_state;
    delete account.note;
    const bcFormat = {
      accountsTableID: Date.now() + i,
      accountName: account.title,
      accountTypeID: 4, // 'FILL IN',
      accountHidden: account.include_in_totals ? 0 : 1,
      accountCurrency: account.currency_code,
      accountConversionRate: null,
      accountConversionRateNew: 1.0,
      currencyChanged: null,
      creditLimit: 0,
      cutOffDa: 0,
      creditCardDueDate: 0,
      cashBasedAccounts: 1, // TODO, remove hardcoded
    };

    return {
      fin: account,
      bc: bcFormat,
    };
  });

  const filepath = CONFIG.PREPARE.OUT.ACCOUNTS;
  console.log(`Writing pre-processed accounts to ${filepath}`);
  await fs.promises.writeFile(filepath, JSON.stringify(accounts, undefined, 2));
  console.log('Done!\n');
}

async function prepareTags(json) {
  console.log('Preparing tags.');
  console.log(`Found ${json.tags.length} tags.`);
  const tags = json.tags.map((t, i) => {
    const tag = Object.assign({}, t);
    delete tag.sync_state;
    delete tag.model_state;
    const bcFormat = {
      labelsTableID: Date.now() + i,
      labelName: tag.title,
      transactionIDLabels: null,
    };
    return {
      fin: tag,
      bc: bcFormat,
    };
  });

  const filepath = CONFIG.PREPARE.OUT.TAGS;
  console.log(`Writing pre-processed tags to ${filepath}`);
  await fs.promises.writeFile(filepath, JSON.stringify(tags, undefined, 2));
  console.log('Done!\n');
}

async function prepareCategories(json) {
  console.log('Preparing categories.');
  console.log(`Found ${json.categories.length} categories.`);
  const categories = json.categories.map((cat, i) => {
    const category = Object.assign({}, cat);
    delete category.sync_state;
    delete category.model_state;
    delete category.sort_order;
    const bcFormat = {
      categoryTableID: Date.now() + i,
      childCategoryName: category.title,
      parentCategoryID: 6,
      budgetAmount: 0,
      budgetPeriod: 3,
      budgetEnabledCategoryChild: 0,
      childCategoryIcon: null,
    };
    return {
      fin: category,
      bc: bcFormat,
    };
  });

  const filepath = CONFIG.PREPARE.OUT.CATEGORIES;
  console.log(`Writing pre-processed categories to ${filepath}`);
  await fs.promises.writeFile(filepath, JSON.stringify(categories, undefined, 2));
  console.log('Done!\n');
}

async function prepareTransactions(json) {
  console.log('Preparing transactions.');
  console.log(`Found ${json.transactions.length} transactions.`);
  const transactions = json.transactions.map((trans) => {
    const transaction = Object.assign({}, trans);
    delete transaction.sync_state;
    delete transaction.model_state;

    if (transaction.account_from_id) {
      const accFrom = json.accounts.find(acc => acc.id === transaction.account_from_id);
      transaction.account_from_name = accFrom.title;
    } else {
      transaction.account_from_name = null;
    }

    if (transaction.account_to_id) {
      const accTo = json.accounts.find(acc => acc.id === transaction.account_to_id);
      transaction.account_to_name = accTo.title;
    } else {
      transaction.account_to_name = null;
    }

    const category = json.categories.find(cat => cat.id === transaction.category_id);
    transaction.category_name = (category && category.title) || null;

    transaction.tag_names = transaction.tag_ids.map((id) => {
      const tag = json.tags.find(t => t.id === id);
      return (tag && tag.title) || null;
    }).filter(tName => !!tName);

    transaction.isExpense = transaction.transaction_type === 1;
    transaction.isIncome = transaction.transaction_type === 2;
    transaction.isTransfer = transaction.transaction_type === 3;

    const bcFormat = {};
    return {
      fin: transaction,
      bc: bcFormat,
    };
  });

  const filepath = CONFIG.PREPARE.OUT.TRANSACTIONS;
  console.log(`Writing pre-processed transactions to ${filepath}`);
  await fs.promises.writeFile(filepath, JSON.stringify(transactions, undefined, 2));
  console.log('Done!\n');
}

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
  console.log('Preparation complete.');
}

module.exports = prepare;

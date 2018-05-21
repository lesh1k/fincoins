'use strict';

const path = require('path');
const fs = require('fs');
const OUT_DIR = path.resolve(__dirname, '../data/out');
const IN_DIR = path.resolve(__dirname, '../data/pre');
const database = require('./db');
const data = fs.readFileSync(path.resolve(__dirname, '../exchange-rates/out.csv'));
const RATES = data.toString().split('\n').map(row => row.trim().split(','));
const CURRENCIES = RATES[0];

migrate();

function migrate() {
  const dbPath = path.join(OUT_DIR, 'bc.fydb');
  fs.copyFileSync(path.join(IN_DIR, 'bc.fydb'), dbPath);
  const db = database.setup(dbPath);
  insertAccounts();
  insertCategories();
  insertTags();
  insertTransactions();
  db.close();
}

function insertTransactions() {
  const transactions = require(path.join(IN_DIR, 'transactions.json'));
  const filtered = transactions;
  const count = filtered.length;
  let i = 1;
  for (const transaction of filtered) {
    console.log(`Inserting transaction "${transaction.fin.id}" (${i++} out of ${count})`);
    if (transaction.fin.isExpense) insertTransactionExpense(transaction.fin);
    else if (transaction.fin.isIncome) insertTransactionIncome(transaction.fin);
    else if (transaction.fin.isTransfer) insertTransactionTransfer(transaction.fin);
    else console.log('Unknown type of transaction');
  }
  console.log('Done creating transactions.\n');
}

function insertTransactionExpense(transaction) {
  const acc = database.select('ACCOUNTSTABLE', 'accountName', transaction.account_from_name);
  const cat = database.select('CHILDCATEGORYTABLE', 'childCategoryName', transaction.category_name);

  const transactionName = getTransactionName(transaction);
  let columns = ['itemName'];
  let values = [transactionName];
  const itemInfo = database.insert('ITEMTABLE', values, columns);


  const data = {
    itemID: itemInfo.lastInsertROWID,
    amount: -transaction.amount * 10000 / getConversionRate(acc.accountCurrency, new Date(transaction.date).toISOString().replace('T', ' ').replace('Z', '').split(' ')[0], 'MDL'),
    transactionCurrency: acc.accountCurrency,
    conversionRateNew: getConversionRate(acc.accountCurrency, new Date(transaction.date).toISOString().replace('T', ' ').replace('Z', '').split(' ')[0], 'MDL'),
    date: new Date(transaction.date).toISOString().replace('T', ' ').replace('Z', ''),
    transactionTypeID: transaction.transaction_type + 2,
    categoryID: transaction.isTransfer ? 3 : cat && cat.categoryTableID || 4,
    accountID: acc.accountsTableID,
    status: 0,
    accountReference: 1,
    accountPairID: getAccountPairID(transaction, acc, true),
    deletedTransaction: 6,
    transferGroupID: 0
  };
  const transactionInfo = database.insert('TRANSACTIONSTABLE', Object.values(data), Object.keys(data));

  columns = ['uidPairID'];
  values = [transactionInfo.lastInsertROWID];
  if (transaction.isTransfer) {
    values[0]++;
    columns.push('transferGroupID');
    values.push(transactionInfo.lastInsertROWID);
  }
  const colSearch = ['transactionsTableID'];
  const valSearch = [transactionInfo.lastInsertROWID];
  database.update('TRANSACTIONSTABLE', columns, values, colSearch, valSearch);

  transaction.tag_names.forEach(tagName => {
    columns = ['labelName', 'transactionIDLabels'];
    values = [tagName, transactionInfo.lastInsertROWID];
    database.insert('LABELSTABLE', values, columns);
  });
}

function getTransactionName(transaction) {
  const parts = [];
  if (transaction.note === 'Account balance update') return transaction.note;
  if (transaction.isTransfer) return `Transfer from ${transaction.account_from_name} to ${transaction.account_to_name}`;
  if (transaction.note) parts.push(transaction.note);
  if (transaction.category_name) parts.push(transaction.category_name);
  if (transaction.tag_names) parts.push(transaction.tag_names.join(','));
  return parts.join(' | ');
}

function getConversionRate(currency, date, base = 'MDL') {
  // if (!CURRENCIES.includes(currency)) throw new Error('Currency not found in exchange-rates CSV ' + currency + date);

  let rates = RATES.find(row => row[0] === date);
  let limit = 20;
  while (!rates) {
    if (limit === 0) throw Error('Could not find exchange rates within 20 days range ' + currency + date);
    date = new Date(date);
    date.setDate(date.getDate()-1);
    date = date.toISOString().split('T')[0];
    rates = RATES.find(row => row[0] === date);
    limit--;
  }
  const indexCurrency = CURRENCIES.indexOf(currency);
  const indexBase = CURRENCIES.indexOf(base);
  if (currency === 'MDL') return 1.0;
  if (currency === 'EUR') return 1 / parseFloat(rates[indexBase]);
  return 1 / (1 / parseFloat(rates[indexCurrency]) * parseFloat(rates[indexBase]));
}

function getAccountPairID(transaction, account, expense = false) {
  if (transaction.isIncome) {
    if (transaction.note === 'Account balance update') {
      return 3;
    } else {
      return 0;
    }
  }
  if (transaction.isExpense) {
    if (transaction.note === 'Account balance update') {
      return 3;
    } else {
      return account.accountsTableID;
    }
  }

  if (transaction.isTransfer) {
    if (expense) {
      const acc = database.select('ACCOUNTSTABLE', 'accountName', transaction.account_to_name);
      return acc.accountsTableID;
    } else {
      const acc = database.select('ACCOUNTSTABLE', 'accountName', transaction.account_from_name);
      return acc.accountsTableID;
    }
  }
  throw Error('Unexpected transaction type');
}

function insertTransactionIncome(transaction) {
  const acc = database.select('ACCOUNTSTABLE', 'accountName', transaction.account_to_name);
  const cat = database.select('CHILDCATEGORYTABLE', 'childCategoryName', transaction.category_name);

  const transactionName = getTransactionName(transaction);
  let columns = ['itemName'];
  let values = [transactionName];
  let itemInfo;
  if (transaction.isTransfer) {
    itemInfo = database.select('ITEMTABLE', 'itemName', transactionName);
    itemInfo = {
      lastInsertROWID: itemInfo.itemTableID
    };
  } else {
    itemInfo = database.insert('ITEMTABLE', values, columns);
  }

  const accFrom = database.select('ACCOUNTSTABLE', 'accountName', transaction.account_from_name);
  const data = {
    itemID: itemInfo.lastInsertROWID,
    amount: transaction.amount * 10000 / getConversionRate(transaction.isTransfer ? accFrom.accountCurrency : acc.accountCurrency, new Date(transaction.date).toISOString().replace('T', ' ').replace('Z', '').split(' ')[0], 'MDL'),
    transactionCurrency: acc.accountCurrency,
    conversionRateNew: getConversionRate(acc.accountCurrency, new Date(transaction.date).toISOString().replace('T', ' ').replace('Z', '').split(' ')[0], 'MDL'),
    date: new Date(transaction.date).toISOString().replace('T', ' ').replace('Z', ''),
    transactionTypeID: transaction.transaction_type + 2,
    categoryID: transaction.isTransfer ? 3 : cat && cat.categoryTableID || 18,
    accountID: acc.accountsTableID,
    status: 0,
    accountReference: transaction.isTransfer ? 2 : 1,
    accountPairID: getAccountPairID(transaction, acc),
    deletedTransaction: 6,
    transferGroupID: 0
  };
  const transactionInfo = database.insert('TRANSACTIONSTABLE', Object.values(data), Object.keys(data));

  columns = ['uidPairID'];
  values = [transactionInfo.lastInsertROWID];
  if (transaction.isTransfer) {
    values[0]--;
    columns.push('transferGroupID');
    values.push(transactionInfo.lastInsertROWID-1);
  }
  const colSearch = ['transactionsTableID'];
  const valSearch = [transactionInfo.lastInsertROWID];
  database.update('TRANSACTIONSTABLE', columns, values, colSearch, valSearch);

  transaction.tag_names.forEach(tagName => {
    columns = ['labelName', 'transactionIDLabels'];
    values = [tagName, transactionInfo.lastInsertROWID];
    database.insert('LABELSTABLE', values, columns);
  });
}

function insertTransactionTransfer(transaction) {
  insertTransactionExpense(transaction);
  insertTransactionIncome(transaction);
}

function insertAccounts() {
  const accounts = require(path.join(IN_DIR, 'accounts.json'));
  for (const acc of accounts) {
    console.log(`Inserting account "${acc.bc.accountName}"`);
    let columnsCount = Object.keys(acc.bc).length;
    let values = Object.values(acc.bc);
    const accountInfo = database.insert('ACCOUNTSTABLE', values, columnsCount);
    const accId = accountInfo.lastInsertROWID;


    let columns = ['itemName'];
    values = [acc.bc.accountName];
    const itemInfo = database.insert('ITEMTABLE', values, columns);

    const data = {
      itemID: itemInfo.lastInsertROWID,
      amount: acc.fin.balance * 10000 / getConversionRate(acc.bc.accountCurrency, new Date('2014').toISOString().replace('T', ' ').replace('Z', '').split(' ')[0]),
      transactionCurrency: acc.bc.accountCurrency,
      conversionRateNew: getConversionRate(acc.bc.accountCurrency, new Date('2014').toISOString().replace('T', ' ').replace('Z', '').split(' ')[0]),
      date: new Date('2014').toISOString().replace('T', ' ').replace('Z', ''),
      transactionTypeID: 2,
      categoryID: 2,
      accountID: accId,
      status: 2,
      accountReference: 3,
      accountPairID: accId,
      deletedTransaction: 6,
      transferGroupID: 0
    };
    const transactionInfo = database.insert('TRANSACTIONSTABLE', Object.values(data), Object.keys(data));

    columns = ['uidPairID'];
    values = [transactionInfo.lastInsertROWID];
    const colSearch = ['transactionsTableID'];
    const valSearch = [transactionInfo.lastInsertROWID];
    database.update('TRANSACTIONSTABLE', columns, values, colSearch, valSearch);
  }
  console.log('Done creating accounts.\n');
}

function insertCategories() {
  const categories = require(path.join(IN_DIR, 'categories.json'));
  for (const cat of categories) {
    const columnsCount = Object.keys(cat.bc).length;
    const values = Object.values(cat.bc);
    database.insert('CHILDCATEGORYTABLE', values, columnsCount);
  }
  console.log('Done creating categories.\n');
}

function insertTags() {
  const tags = require(path.join(IN_DIR, 'tags.json'));
  for (const tag of tags) {
    const columnsCount = Object.keys(tag.bc).length;
    const values = Object.values(tag.bc);
    database.insert('LABELSTABLE', values, columnsCount);
  }
  console.log('Done creating tags.');
}

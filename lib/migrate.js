'use strict';

const path = require('path');
const fs = require('fs');
const OUT_DIR = path.resolve(__dirname, '../data/out');
const IN_DIR = path.resolve(__dirname, '../data/pre');
const database = require('./db');

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
  const filtered = transactions.filter(transaction => transaction.fin.isExpense);
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


  // console.log(acc, cat);process.exit();
  const transactionName = getTransactionName(transaction);
  let columns = ['itemName'];
  let values = [transactionName];
  const itemInfo = database.insert('ITEMTABLE', values, columns);


  const data = {
    itemID: itemInfo.lastInsertROWID,
    amount: transaction.amount * 10000,
    transactionCurrency: acc.accountCurrency,
    conversionRateNew: getConversionRate(acc.accountCurrency, 'MDL'),
    date: new Date(transaction.date).toISOString().replace('T', ' ').replace('Z', ''),
    transactionTypeID: transaction.transaction_type + 2,
    categoryID: cat && cat.categoryTableID || 4,
    accountID: acc.accountsTableID,
    status: 2,
    accountReference: 1,
    accountPairID: acc.accountsTableID,
    deletedTransaction: 6,
    transferGroupID: 0
  };
  const transactionInfo = database.insert('TRANSACTIONSTABLE', Object.values(data), Object.keys(data));

  columns = ['uidPairID'];
  values = [transactionInfo.lastInsertROWID];
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
  if (transaction.note) parts.push(transaction.note);
  if (transaction.category_name) parts.push(transaction.category_name);
  if (transaction.tag_names) parts.push(transaction.tag_names.join(','));
  return parts.join(' | ');
}

function getConversionRate(currency, base = 'MDL') {
  if (currency === 'USD') return 1 / 17;
  if (currency === 'EUR') return 1 / 20;
  if (currency === 'UAH') return 1 / 0.8;
  if (currency === 'RUB') return 1 / 0.4;
  return 1.0;
}

function insertTransactionIncome(transaction) {}
function insertTransactionTransfer(transaction) {}

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
      amount: acc.fin.balance * 10000,
      transactionCurrency: acc.bc.accountCurrency,
      conversionRateNew: 1.0,
      date: new Date().toISOString().replace('T', ' ').replace('Z', ''),
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

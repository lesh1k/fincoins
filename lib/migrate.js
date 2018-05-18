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
  insertTags(db);
  db.close();
}

function insertAccounts() {
  const accounts = require(path.join(IN_DIR, 'accounts.json'));
  let i = Date.now();
  for (const acc of accounts) {
    let columnsCount = Object.keys(acc.bc).length;
    let values = Object.values(acc.bc);
    const accountInfo = database.insert('ACCOUNTSTABLE', values, columnsCount);


    let columns = ['itemName'];
    values = [acc.bc.accountName];
    const itemInfo = database.insert('ITEMTABLE', values, columns);


    const accId = accountInfo.lastInsertROWID;
    columns = [
      'transactionsTableID', 'itemID', 'amount', 'transactionCurrency',
      'conversionRateNew', 'date', 'transactionTypeID', 'categoryID',
      'accountID', 'status', 'accountReference', 'accountPairID',
      'uidPairID', 'deletedTransaction', 'transferGroupID'
    ];
    values = [
      i, itemInfo.lastInsertROWID, acc.fin.balance,
      `'${acc.bc.accountCurrency}'`, 1.0,
      `'${new Date().toISOString().replace('T', ' ').replace('Z', '')}'`,
      2, 2, accId, 2, 3, accId, i, 6, 0
    ];
    database.insert('TRANSACTIONSTABLE', values, columns);

    i++;
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

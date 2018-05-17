'use strict';

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const OUT_DIR = path.resolve(__dirname, '../data/out');
const IN_DIR = path.resolve(__dirname, '../data/pre');

migrate();

function migrate() {
  const dbPath = path.join(OUT_DIR, 'bc.fydb');
  fs.copyFileSync(path.join(IN_DIR, 'bc.fydb'), dbPath);
  const db = new Database(dbPath);
  migrateAccounts(db);
  migrateCategories(db);
  migrateTags(db);
  db.close();
}

function migrateAccounts(db) {
  const accounts = require(path.join(IN_DIR, 'accounts.json'));
  let i = Date.now();
  for (const acc of accounts) {
    const tmpl = Array(Object.keys(acc.bc).length + 1).join('?').split('').join(',');
    console.log(`Creating account "${acc.fin.title}"`);
    const stmt = db.prepare(`INSERT INTO ACCOUNTSTABLE VALUES (${tmpl});`);
    const accountInfo = stmt.run(Object.values(acc.bc));

    const tmplItem = '?';
    // console.log(`INSERT INTO ITEMTABLE (itemName) VALUES (${acc.bc.accountName});`);
    const stmtItem = db.prepare(`INSERT INTO ITEMTABLE (itemName) VALUES ("${acc.bc.accountName}");`);
    const itemInfo = stmtItem.run();

    const accId = accountInfo.lastInsertROWID;
    const tmplTransaction = Array(38).join('?').split('').join(',');
    const q = `INSERT INTO TRANSACTIONSTABLE (transactionsTableID, itemID, amount, transactionCurrency, conversionRateNew, date, transactionTypeID, categoryID, accountID, status, accountReference, accountPairID, uidPairID, deletedTransaction, transferGroupID) VALUES (${[
        i,
        itemInfo.lastInsertROWID,
        acc.fin.balance,
        `'${acc.bc.accountCurrency}'`,
        1.0,
        `'${new Date().toISOString().replace('T', ' ').replace('Z', '')}'`,
        2,
        2,
        accId,
        2,
        3,
        accId,
        i,
        6,
        0
      ].join(',')
    });`;
    console.log(q);
    const stmtTransaction = db.prepare(q);
    // const values = Array(37);
    // const accId = accountInfo.lastInsertROWID;
    // values[1] = itemInfo.lastInsertROWID;
    // values[2] = acc.fin.balance;
    // values[3] = acc.bc.accountCurrency;
    // values[7] = 2;
    // values[8] = 2;
    // values[9] = accId;
    // values[11] = 2;
    // values[12] = 3;
    // values[13] = accId;
    // values[14] = accId;
    // values[18] = 0;
    // // values[] = ;
    stmtTransaction.run();
    i++;
  }
  console.log('Done creating accounts.\n');
}

function migrateCategories(db) {
  const categories = require(path.join(IN_DIR, 'categories.json'));
  for (const cat of categories) {
    const tmpl = Array(Object.keys(cat.bc).length + 1).join('?').split('').join(',');
    console.log(`Creating category "${cat.fin.title}"`);
    const stmt = db.prepare(`INSERT INTO CHILDCATEGORYTABLE VALUES (${tmpl});`);
    stmt.run(Object.values(cat.bc));
  }
  console.log('Done creating categories.\n');
}

function migrateTags(db) {
  const tags = require(path.join(IN_DIR, 'tags.json'));
  for (const tag of tags) {
    const tmpl = Array(Object.keys(tag.bc).length + 1).join('?').split('').join(',');
    console.log(`Creating label "${tag.fin.title}"`);
    const stmt = db.prepare(`INSERT INTO LABELSTABLE VALUES (${tmpl});`);
    stmt.run(Object.values(tag.bc));
  }
  console.log('Done creating tags.');
}

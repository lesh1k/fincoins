const fs = require('fs');
const CONFIG = require('../config');
const database = require('../db');
const { getConversionRate } = require('./utils');

async function insertAccounts() {
  const accountsJson = await fs.promises.readFile(CONFIG.INPUT.ACCOUNTS);
  const accounts = JSON.parse(accountsJson);
  accounts.forEach((acc) => {
    console.log(`Inserting account "${acc.bc.accountName}"`);
    const columnsCount = Object.keys(acc.bc).length;
    let values = Object.values(acc.bc);
    const accountInfo = database.insert('ACCOUNTSTABLE', values, columnsCount);
    const accId = accountInfo.lastInsertROWID;


    let columns = ['itemName'];
    values = [acc.bc.accountName];
    const itemInfo = database.insert('ITEMTABLE', values, columns);

    const data = {
      itemID: itemInfo.lastInsertROWID,
      amount: acc.fin.balance * 10000 / getConversionRate(acc.bc.accountCurrency, new Date('2014').toISOString().replace('T', ' ').replace('Z', '')
        .split(' ')[0]),
      transactionCurrency: acc.bc.accountCurrency,
      conversionRateNew: getConversionRate(acc.bc.accountCurrency, new Date('2014').toISOString().replace('T', ' ').replace('Z', '')
        .split(' ')[0]),
      date: new Date('2014').toISOString().replace('T', ' ').replace('Z', ''),
      transactionTypeID: 2,
      categoryID: 2,
      accountID: accId,
      status: 2,
      accountReference: 3,
      accountPairID: accId,
      deletedTransaction: 6,
      transferGroupID: 0,
    };
    const transactionInfo = database.insert('TRANSACTIONSTABLE', Object.values(data), Object.keys(data));

    columns = ['uidPairID'];
    values = [transactionInfo.lastInsertROWID];
    const colSearch = ['transactionsTableID'];
    const valSearch = [transactionInfo.lastInsertROWID];
    database.update('TRANSACTIONSTABLE', columns, values, colSearch, valSearch);
  });
  console.log('Done creating accounts.\n');
}

module.exports = insertAccounts;

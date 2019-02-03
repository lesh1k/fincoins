const fs = require('fs');
const CONFIG = require('../config');
const database = require('../db');
const { getConversionRate } = require('./utils');


function getTransactionName(transaction) {
  const parts = [];
  if (transaction.note === 'Account balance update') return transaction.note;
  if (transaction.isTransfer) return `Transfer from ${transaction.account_from_name} to ${transaction.account_to_name}`;
  if (transaction.note) parts.push(transaction.note);
  if (transaction.category_name) parts.push(transaction.category_name);
  if (transaction.tag_names) parts.push(transaction.tag_names.join(','));
  return parts.join(' | ');
}

function getAccountPairID(transaction, account, expense = false) {
  if (transaction.isIncome) {
    if (transaction.note === 'Account balance update') {
      return 3;
    }
    return 0;
  }

  if (transaction.isExpense) {
    if (transaction.note === 'Account balance update') {
      return 3;
    }
    return account.accountsTableID;
  }

  if (transaction.isTransfer) {
    if (expense) {
      const acc = database.select('ACCOUNTSTABLE', 'accountName', transaction.account_to_name);
      return acc.accountsTableID;
    }
    const acc = database.select('ACCOUNTSTABLE', 'accountName', transaction.account_from_name);
    return acc.accountsTableID;
  }
  throw Error('Unexpected transaction type');
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
    amount: -transaction.amount * 10000 / getConversionRate(acc.accountCurrency, new Date(transaction.date).toISOString().replace('T', ' ').replace('Z', '')
      .split(' ')[0], 'MDL'),
    transactionCurrency: acc.accountCurrency,
    conversionRateNew: getConversionRate(acc.accountCurrency, new Date(transaction.date).toISOString().replace('T', ' ').replace('Z', '')
      .split(' ')[0], 'MDL'),
    date: new Date(transaction.date).toISOString().replace('T', ' ').replace('Z', ''),
    transactionTypeID: transaction.transaction_type + 2,
    categoryID: transaction.isTransfer ? 3 : (cat && cat.categoryTableID) || 4,
    accountID: acc.accountsTableID,
    status: 0,
    accountReference: 1,
    accountPairID: getAccountPairID(transaction, acc, true),
    deletedTransaction: 6,
    transferGroupID: 0,
  };
  const transactionInfo = database.insert('TRANSACTIONSTABLE', Object.values(data), Object.keys(data));

  columns = ['uidPairID'];
  values = [transactionInfo.lastInsertROWID];
  if (transaction.isTransfer) {
    values[0] += 1;
    columns.push('transferGroupID');
    values.push(transactionInfo.lastInsertROWID);
  }
  const colSearch = ['transactionsTableID'];
  const valSearch = [transactionInfo.lastInsertROWID];
  database.update('TRANSACTIONSTABLE', columns, values, colSearch, valSearch);

  transaction.tag_names.forEach((tagName) => {
    columns = ['labelName', 'transactionIDLabels'];
    values = [tagName, transactionInfo.lastInsertROWID];
    database.insert('LABELSTABLE', values, columns);
  });
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
      lastInsertROWID: itemInfo.itemTableID,
    };
  } else {
    itemInfo = database.insert('ITEMTABLE', values, columns);
  }

  const accFrom = database.select('ACCOUNTSTABLE', 'accountName', transaction.account_from_name);
  const data = {
    itemID: itemInfo.lastInsertROWID,
    amount: transaction.amount * 10000 / getConversionRate(transaction.isTransfer ? accFrom.accountCurrency : acc.accountCurrency, new Date(transaction.date).toISOString().replace('T', ' ').replace('Z', '')
      .split(' ')[0], 'MDL'),
    transactionCurrency: acc.accountCurrency,
    conversionRateNew: getConversionRate(acc.accountCurrency, new Date(transaction.date).toISOString().replace('T', ' ').replace('Z', '')
      .split(' ')[0], 'MDL'),
    date: new Date(transaction.date).toISOString().replace('T', ' ').replace('Z', ''),
    transactionTypeID: transaction.transaction_type + 2,
    categoryID: transaction.isTransfer ? 3 : (cat && cat.categoryTableID) || 18,
    accountID: acc.accountsTableID,
    status: 0,
    accountReference: transaction.isTransfer ? 2 : 1,
    accountPairID: getAccountPairID(transaction, acc),
    deletedTransaction: 6,
    transferGroupID: 0,
  };
  const transactionInfo = database.insert('TRANSACTIONSTABLE', Object.values(data), Object.keys(data));

  columns = ['uidPairID'];
  values = [transactionInfo.lastInsertROWID];
  if (transaction.isTransfer) {
    values[0] -= 1;
    columns.push('transferGroupID');
    values.push(transactionInfo.lastInsertROWID - 1);
  }
  const colSearch = ['transactionsTableID'];
  const valSearch = [transactionInfo.lastInsertROWID];
  database.update('TRANSACTIONSTABLE', columns, values, colSearch, valSearch);

  transaction.tag_names.forEach((tagName) => {
    columns = ['labelName', 'transactionIDLabels'];
    values = [tagName, transactionInfo.lastInsertROWID];
    database.insert('LABELSTABLE', values, columns);
  });
}

function insertTransactionTransfer(transaction) {
  insertTransactionExpense(transaction);
  insertTransactionIncome(transaction);
}

async function insertTransactions() {
  console.log('\nInserting transactions...');
  const transactionsJson = await fs.promises.readFile(CONFIG.INPUT.TRANSACTIONS);
  const transactions = JSON.parse(transactionsJson);
  const count = transactions.length;
  let i = 1;
  transactions.forEach((transaction) => {
    console.log(`Inserting transaction "${transaction.fin.id}" (${i += 1} out of ${count})`);
    if (transaction.fin.isExpense) insertTransactionExpense(transaction.fin);
    else if (transaction.fin.isIncome) insertTransactionIncome(transaction.fin);
    else if (transaction.fin.isTransfer) insertTransactionTransfer(transaction.fin);
    else console.log('Unknown type of transaction');
  });
  console.log('Done.');
}

module.exports = insertTransactions;

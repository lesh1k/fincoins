const { getConversionRate } = require('../utils');
const database = require('../../db');
const { getAccountPairID, getTransactionName } = require('./helpers');

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

module.exports = insertTransactionExpense;

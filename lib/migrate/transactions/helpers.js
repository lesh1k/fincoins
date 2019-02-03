const database = require('../../db');

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

module.exports = {
  getAccountPairID,
  getTransactionName,
};

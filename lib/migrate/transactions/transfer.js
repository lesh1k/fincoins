const insertTransactionExpense = require('./expense');
const insertTransactionIncome = require('./income');

function insertTransactionTransfer(transaction) {
  insertTransactionExpense(transaction);
  insertTransactionIncome(transaction);
}

module.exports = insertTransactionTransfer;

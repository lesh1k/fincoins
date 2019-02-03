const fs = require('fs');
const CONFIG = require('../../config');
const insertTransactionExpense = require('./expense');
const insertTransactionIncome = require('./income');
const insertTransactionTransfer = require('./transfer');

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

const fs = require('fs');
const CONFIG = require('../config');
const makeExpenseEntry = require('./expense');
const makeIncomeEntry = require('./income');
const makeTransferEntry = require('./transfer');

async function csv() {
  console.log('\nCreating transactions CSV...');
  let data = await fs.promises.readFile(CONFIG.INPUT.CSV, 'utf8');
  data = [data.split('\n').shift().trim()];
  const transactionsJson = await fs.promises.readFile(CONFIG.INPUT.TRANSACTIONS);
  const transactions = JSON.parse(transactionsJson);
  const count = transactions.length;

  // These type of transactions is either non-confirmed OR pending OR in my
  // case these were some ghost transactions (probably deleted)
  const skippedTransactions = transactions.filter(t => t.fin.transaction_state === 2);
  transactions.filter(t => t.fin.transaction_state !== 2).forEach((transaction, i) => {
    console.log(`Inserting transaction "${transaction.fin.id}" (${i + 1} out of ${count})`);
    if (transaction.fin.isExpense) data.push(makeExpenseEntry(transaction.fin));
    else if (transaction.fin.isIncome) data.push(makeIncomeEntry(transaction.fin));
    else if (transaction.fin.isTransfer) data.push(makeTransferEntry(transaction.fin));
    else console.log('Unknown type of transaction');
  });
  await fs.promises.writeFile(CONFIG.OUTPUT.CSV, data.join('\n'));
  if (skippedTransactions.length) {
    console.warn(`WARNING! Skipped ${skippedTransactions.length} transactions with transaction_state == 2. You can find these in ${CONFIG.OUTPUT.SKIPPED}`);
    console.warn('WARNING! Writing skipped transactions to file.');
    await fs.promises.writeFile(CONFIG.OUTPUT.SKIPPED, JSON.stringify(skippedTransactions, undefined, 2));
  }

  console.log('Done.');
}

module.exports = csv;

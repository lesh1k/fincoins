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
  let i = 1;
  transactions.forEach((transaction) => {
    console.log(`Inserting transaction "${transaction.fin.id}" (${i += 1} out of ${count})`);
    if (transaction.fin.isExpense) data.push(makeExpenseEntry(transaction.fin));
    else if (transaction.fin.isIncome) data.push(makeIncomeEntry(transaction.fin));
    else if (transaction.fin.isTransfer) data.push(makeTransferEntry(transaction.fin));
    else console.log('Unknown type of transaction');
  });
  await fs.promises.writeFile(CONFIG.OUTPUT.CSV, data.join('\n'));
  console.log('Done.');
}

module.exports = csv;

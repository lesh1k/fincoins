const fs = require('fs');
const moment = require('moment');
const CONFIG = require('./config');
const { getConversionRate } = require('./migrate/utils');

async function dryRun() {
  const data = {
    transactions: JSON.parse(await fs.promises.readFile(CONFIG.INPUT.TRANSACTIONS)).map(t => t.fin),
    accounts: JSON.parse(await fs.promises.readFile(CONFIG.INPUT.ACCOUNTS)),
    categories: JSON.parse(await fs.promises.readFile(CONFIG.INPUT.CATEGORIES)),
    tags: JSON.parse(await fs.promises.readFile(CONFIG.INPUT.TAGS)),
  };
  const result = {
    accounts: data.accounts.map(acc => ({
      name: acc.fin.title,
      balance: acc.fin.balance,
      currency: acc.fin.currency_code,
      id: acc.fin.id,
    })),
  };
  data.transactions.forEach((transaction, i) => {
    console.log(`Applying transaction ${i + 1} out of ${data.transactions.length}`);
    const {
      exchange_rate: rate,
      amount,
      // date,
      account_from_id: from,
      account_to_id: to,
      transaction_state: state,
      // account_from_currency: fromCur,
      // account_to_currency: toCur,
    } = transaction;
    if (state === 2) {
      console.log('Skipped:', {
        amount: transaction.amount,
        note: transaction.note,
        state: transaction.transaction_state,
        date: new Date(transaction.date),
      });
    }

    if (from) result.accounts.find(acc => acc.id === from).balance -= amount;
    if (to) result.accounts.find(acc => acc.id === to).balance += (amount * rate);
  });
  result.accounts.forEach((acc) => { acc.balance = (acc.balance / 100).toFixed(2); });
  console.log(result);
}

module.exports = dryRun;

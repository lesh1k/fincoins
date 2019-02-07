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
    // console.log(`Dry-run. Applying transaction ${i + 1} out of ${data.transactions.length}`);
    let {
      exchange_rate: rate,
      amount,
      date,
      account_from_id: from,
      account_to_id: to,
      transaction_state: state,
      account_from_currency: fromCur,
      account_to_currency: toCur,
    } = transaction;
    if (to && from) {
      const currency = fromCur === CONFIG.BASE ? toCur : fromCur;
      // rate = getConversionRate(toCur, moment(date).format('YYYY-MM-DD'), fromCur);
      rate = getConversionRate(currency, moment(transaction.date).format('YYYY-MM-DD'), CONFIG.BASE);
    }
    if (state === 2) {
      console.log('Dry run skipped transactions info:', {
        amount: transaction.amount,
        note: transaction.note,
        state: transaction.transaction_state,
        date: new Date(transaction.date),
      });
    }

    // console.log(transaction)
    if (from) {
      result.accounts.find(acc => acc.id === from).balance -= amount;
    }
    if (to) {
      rate = (() => {
        if (!to || !from) return rate;
        // if (fromCur === toCur) return 1;
        // if (fromCur === CONFIG.BASE) return rate;
        // if (toCur === CONFIG.BASE) return 1 / rate;
        const r1 = getConversionRate(fromCur, moment(transaction.date).format('YYYY-MM-DD'), CONFIG.BASE);
        const r2 = getConversionRate(toCur, moment(transaction.date).format('YYYY-MM-DD'), CONFIG.BASE);
        return r1 / r2;
      })();
      result.accounts.find(acc => acc.id === to).balance += amount / rate;
    }
  });
  // result.accounts.forEach((acc) => { acc.balance = parseFloat((acc.balance).toFixed(2), 10); });
  console.log('Dry run results:', result);
  return result;
}

module.exports = dryRun;

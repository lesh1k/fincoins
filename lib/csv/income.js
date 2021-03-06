const moment = require('moment');
const CONFIG = require('../config');
const { getConversionRate } = require('../migrate/utils');
const { getTransactionType, getTransactionName, makeCsvLine } = require('./helpers');

function insertTransactionIncome(transaction) {
  const rate = getConversionRate(transaction.account_to_currency, moment(transaction.date).format('YYYY-MM-DD'), CONFIG.BASE);

  const amount = transaction.amount / 100 / rate;
  const data = {
    type: getTransactionType(transaction),
    date: moment(transaction.date).format('M/D/YYYY HH:mm'),
    title: getTransactionName(transaction),
    amount,
    currency: transaction.account_to_currency,
    conversionRate: rate,
    parentCategory: transaction.category_name,
    category: transaction.category_name,
    accType: 'Cash', // TODO: determine correct acc type
    account: transaction.account_to_name,
    note: transaction.note,
    label: transaction.tag_names.join(' '),
    status: '',
  };

  return makeCsvLine(data);
}

module.exports = insertTransactionIncome;

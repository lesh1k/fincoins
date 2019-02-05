const moment = require('moment');
const { getConversionRate } = require('../migrate/utils');
const CONFIG = require('../config');
const { getTransactionName, getTransactionType, makeCsvLine } = require('./helpers');

function expense(transaction) {
  const currency = transaction.account_from_currency === CONFIG.BASE ? transaction.account_to_currency : transaction.account_from_currency;
  const rate = getConversionRate(currency, moment(transaction.date).format('YYYY-MM-DD'), CONFIG.BASE);

  const amount = -transaction.amount / 100 / (transaction.account_from_currency === CONFIG.BASE ? 1 : rate);
  const data = {
    type: getTransactionType(transaction),
    date: moment(transaction.date).format('M/D/YYYY HH:mm'),
    title: getTransactionName(transaction),
    amount,
    currency: transaction.account_from_currency,
    conversionRate: rate,
    parentCategory: '(Transfer)',
    category: '(Transfer)',
    accType: 'Cash', // TODO: determine correct acc type
    account: transaction.account_from_name,
    note: transaction.note,
    label: transaction.tag_names.join(' '),
    status: '',
  };

  return makeCsvLine(data);
}

function income(transaction) {
  const currency = transaction.account_from_currency === CONFIG.BASE ? transaction.account_to_currency : transaction.account_from_currency;
  const rate = getConversionRate(currency, moment(transaction.date).format('YYYY-MM-DD'), CONFIG.BASE);

  const amount = transaction.amount / 100 / (transaction.account_from_currency === CONFIG.BASE ? 1 : rate);
  const data = {
    type: getTransactionType(transaction),
    date: moment(transaction.date).format('M/D/YYYY HH:mm'),
    title: getTransactionName(transaction),
    amount,
    currency: transaction.account_to_currency,
    conversionRate: rate,
    parentCategory: '(Transfer)',
    category: '(Transfer)',
    accType: 'Cash', // TODO: determine correct acc type
    account: transaction.account_to_name,
    note: transaction.note,
    label: transaction.tag_names.join(' '),
    status: '',
  };

  return makeCsvLine(data);
}

function makeTransferEntry(transaction) {
  const e = expense(transaction);
  const i = income(transaction);
  console.log([e, i].join('\n'));
  return [e, i].join('\n');
}

module.exports = makeTransferEntry;

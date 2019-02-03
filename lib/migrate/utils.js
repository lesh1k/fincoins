const CONFIG = require('../config');
const ExchangeRates = require('../ExchangeRates');

let xe;

function getConversionRate(currency, date, base = CONFIG.BASE) {
  if (!xe) {
    if (!CONFIG.START_DATE || !CONFIG.END_DATE) {
      throw new Error('START_DATE and/or END_DATE for first/last transactions are missing in config');
    }
    xe = new ExchangeRates(CONFIG.BASE, CONFIG.START_DATE, CONFIG.END_DATE);
  }
  return xe.getRate(date, currency, base);
}

module.exports = {
  getConversionRate,
};

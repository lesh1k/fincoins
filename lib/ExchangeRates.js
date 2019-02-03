const fs = require('fs');
const path = require('path');
const moment = require('moment');
const getRates = require('exchange-rates');

const dir = path.resolve(__dirname, '../exchange-rates/');

function findMissingIntervals(rates, startDate, endDate) {
  console.log('Determining missing date intervals to download rates.');
  const missingIntervals = [];
  const start = moment(startDate);
  const end = moment(endDate);
  const ratesStart = moment(rates.startDate);
  const ratesEnd = moment(rates.endDate);

  if (start.isAfter(ratesEnd)) {
    missingIntervals.push({
      startDate: rates.endDate,
      endDate,
    });
  } else if (end.isBefore(ratesStart)) {
    missingIntervals.push({
      startDate,
      endDate: rates.startDate,
    });
  } else if (start.isBefore(ratesStart) && end.isBetween(ratesStart.clone().subtract(1, 'd'), ratesEnd.clone().add(1, 'd'))) {
    // have to widen the interval by 1 day, because it works as EXCLUSIVE check,
    // i.e. 2000-10-20 is NOT between 2000-10-20 and 2000-10-25
    missingIntervals.push({
      startDate,
      endDate: ratesStart.format('YYYY-MM-DD'),
    });
  } else if (end.isAfter(ratesEnd) && start.isBetween(ratesStart.clone().subtract(1, 'd'), ratesEnd.clone().add(1, 'd'))) {
    missingIntervals.push({
      startDate: ratesEnd.format('YYYY-MM-DD'),
      endDate,
    });
  } else if (end.isAfter(ratesEnd) && start.isBefore(ratesStart)) {
    // Means that existing interval is between requested interval
    missingIntervals.push({
      startDate,
      endDate: ratesStart.format('YYYY-MM-DD'),
    });
    missingIntervals.push({
      startDate: ratesEnd.format('YYYY-MM-DD'),
      endDate,
    });
  }
  return missingIntervals;
}

async function downloadMissingRates(rates, startDate, endDate) {
  const baseCurrency = rates.base;
  const missingIntervals = findMissingIntervals(rates, startDate, endDate);

  if (!missingIntervals.length) {
    // Means that the existing interval covers the requested one
    console.log('No missing intervals found.');
    return rates.rates;
  }

  console.log('Found the following missing intervals:', missingIntervals);
  console.log('Downloading missing rates');
  const missingIntervalsRates = await Promise.all(
    missingIntervals.map(
      async interval => JSON.parse(
        await getRates(baseCurrency, interval.startDate, interval.endDate, true),
      ),
    ),
  );
  const missingRates = Object.assign({}, ...missingIntervalsRates.map(data => (data.rates)));
  return missingRates;
}

class ExchangeRates {
  constructor(baseCurrency, start, end) {
    const out = path.join(dir, `rates-${baseCurrency.toLowerCase()}.json`);
    if (!fs.existsSync(out)) {
      throw new Error('No rates data file found. First download the rates using ExchangeRates.download(...) static method');
    }

    const data = JSON.parse(fs.readFileSync(out));
    const ratesInterval = [
      moment(data.startDate).subtract(1, 'd'),
      moment(data.endDate).add(1, 'd'),
    ];

    if (!moment(start).isBetween(...ratesInterval) || !moment(end).isBetween(...ratesInterval)) {
      throw new Error('Existsing rates data does not cover the requested interval. Download missing rates using ExchangeRates.download(...) static method');
    }

    this.baseCurrency = data.base;
    this.rates = data.rates;
    this.startDate = data.startDate;
    this.endDate = data.endDate;
  }

  /**
   * How much currency1 will one get for 1 base
   * @param {string} date - YYYY-MM-DD
   * @param {string} currency1 - XXX 3-letter currency code. The currency of interest.
   * @param {string} base - XXX 3-letter currency code. The currency of reference.
   * @returns {number} - How much currency1 will one get for 1 base. Precision - 4 decimal places
   */
  getRate(date, currency1, base = this.baseCurrency) {
    let rate = 1;
    if (currency1 === base) return rate;
    if (base === this.baseCurrency) {
      rate = this.rates[date][currency1];
    } else if (currency1 === this.baseCurrency) {
      rate = 1 / this.rates[date][base];
    } else {
      const rateTarget = this.rates[date][currency1];
      const rateBase = this.rates[date][base];
      rate = rateTarget / rateBase;
    }

    if (!rate || !Number.isFinite(rate)) {
      throw new Error(`Bad result retrieving exchange rate of "1 ${base} in ${currency1} on ${date}". Rate: ${rate}`);
    }

    return parseFloat(rate.toFixed(4), 10);
  }

  static async download(baseCurrency, startDate, endDate) {
    const out = path.join(dir, `rates-${baseCurrency.toLowerCase()}.json`);
    let rates;
    if (!fs.existsSync(out)) {
      rates = JSON.parse(await getRates(baseCurrency, startDate, endDate, true));
    } else {
      rates = JSON.parse(fs.readFileSync(out));
      if (baseCurrency !== rates.base) {
        throw new Error('Base currency requested differs from base currency in existing file');
      }
      const missingRates = await downloadMissingRates(rates, startDate, endDate);
      rates.rates = Object.assign({}, rates.rates, missingRates);
      const sortedDates = Object.keys(rates.rates).sort((d1, d2) => new Date(d1) - new Date(d2));
      rates.startDate = sortedDates.shift();
      rates.endDate = sortedDates.pop();
    }
    console.log(`Writing rates to ${out}`);
    await fs.promises.writeFile(out, JSON.stringify(rates));

    return rates.rates;
  }
}

module.exports = ExchangeRates;

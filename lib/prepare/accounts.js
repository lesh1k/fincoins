const fs = require('fs');
const CONFIG = require('../config');

async function prepareAccounts(json) {
  console.log('Preparing accounts.');
  console.log(`Found ${json.accounts.length} accounts.`);
  const accounts = json.accounts.map((acc, i) => {
    const account = Object.assign({}, acc);
    delete account.sync_state;
    delete account.model_state;
    delete account.note;
    const bcFormat = {
      accountsTableID: Date.now() + i,
      accountName: account.title,
      accountTypeID: 4, // 'FILL IN',
      accountHidden: account.include_in_totals ? 0 : 1,
      accountCurrency: account.currency_code,
      accountConversionRate: null,
      accountConversionRateNew: 1.0,
      currencyChanged: null,
      creditLimit: 0,
      cutOffDa: 0,
      creditCardDueDate: 0,
      cashBasedAccounts: 1, // TODO, remove hardcoded
    };

    return {
      fin: account,
      bc: bcFormat,
    };
  });

  const filepath = CONFIG.PREPARE.OUT.ACCOUNTS;
  console.log(`Writing pre-processed accounts to ${filepath}`);
  await fs.promises.writeFile(filepath, JSON.stringify(accounts, undefined, 2));
  console.log('Done!\n');
}

module.exports = prepareAccounts;

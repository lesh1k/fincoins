const fs = require('fs');
const CONFIG = require('../config');

async function prepareTransactions(json) {
  console.log('Preparing transactions.');
  console.log(`Found ${json.transactions.length} transactions.`);
  const transactions = json.transactions.map((trans) => {
    const transaction = Object.assign({}, trans);
    delete transaction.sync_state;
    delete transaction.model_state;

    if (transaction.account_from_id) {
      const accFrom = json.accounts.find(acc => acc.id === transaction.account_from_id);
      transaction.account_from_name = accFrom.title;
    } else {
      transaction.account_from_name = null;
    }

    if (transaction.account_to_id) {
      const accTo = json.accounts.find(acc => acc.id === transaction.account_to_id);
      transaction.account_to_name = accTo.title;
    } else {
      transaction.account_to_name = null;
    }

    const category = json.categories.find(cat => cat.id === transaction.category_id);
    transaction.category_name = (category && category.title) || null;

    transaction.tag_names = transaction.tag_ids.map((id) => {
      const tag = json.tags.find(t => t.id === id);
      return (tag && tag.title) || null;
    }).filter(tName => !!tName);

    transaction.isExpense = transaction.transaction_type === 1;
    transaction.isIncome = transaction.transaction_type === 2;
    transaction.isTransfer = transaction.transaction_type === 3;

    const bcFormat = {};
    return {
      fin: transaction,
      bc: bcFormat,
    };
  });

  const filepath = CONFIG.PREPARE.OUT.TRANSACTIONS;
  console.log(`Writing pre-processed transactions to ${filepath}`);
  await fs.promises.writeFile(filepath, JSON.stringify(transactions, undefined, 2));
  console.log('Done!\n');
}

module.exports = prepareTransactions;

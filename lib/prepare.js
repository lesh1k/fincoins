'use strict';

const json = require('../data/in/financius.json');
const fs = require('fs');
const path = require('path');
const OUT_DIR = path.resolve(__dirname, '../data/pre');

prepare(json);

function prepare(json) {
  prepareAccounts(json);
  prepareTags(json);
  prepareCategories(json);
  console.log(`Copying financius data JSON and Bluecoins source DB to ${OUT_DIR}`);
  fs.copyFileSync(path.resolve(__dirname, '../data/in/financius.json'), path.join(OUT_DIR, 'financius.json'));
  fs.copyFileSync(path.resolve(__dirname, '../data/in/bc.fydb'), path.join(OUT_DIR, 'bc.fydb'));
}

function prepareAccounts(json) {
  console.log('Preparing accounts.');
  console.log(`Found ${json.accounts.length} accounts.`);
  const accounts = json.accounts.map((acc, i) => {
    acc = Object.assign({}, acc);
    delete acc.sync_state;
    delete acc.model_state;
    delete acc.note;
    const bcFormat = {
      accountsTableID: Date.now() + i,
      accountName: acc.title,
      accountTypeID: 4,  //'FILL IN',
      accountHidden: acc.include_in_totals ? 0 : 1,
      accountCurrency: acc.currency_code,
      accountConversionRate: null,
      accountConversionRateNew: 1.0,
      currencyChanged: null,
      creditLimit: 0,
      cutOffDa: 0,
      creditCardDueDate: 0
    };

    return {
      fin: acc,
      bc: bcFormat
    };
  });

  const filepath = path.join(OUT_DIR, 'accounts.json');
  console.log(`Writing pre-processed accounts to ${filepath}`);
  fs.writeFileSync(filepath, JSON.stringify(accounts, void 0, 2));
  console.log('Done!\n');
}

function prepareTags(json) {
  console.log('Preparing tags.');
  console.log(`Found ${json.tags.length} tags.`);
  const tags = json.tags.map((tag, i) => {
    tag = Object.assign({}, tag);
    delete tag.sync_state;
    delete tag.model_state;
    const bcFormat = {
      labelsTableID: Date.now() + i,
      labelName: tag.title,
      transactionIDLabels: null
    };
    return {
      fin: tag,
      bc: bcFormat
    };
  });

  const filepath = path.join(OUT_DIR, 'tags.json');
  console.log(`Writing pre-processed tags to ${filepath}`);
  fs.writeFileSync(filepath, JSON.stringify(tags, void 0, 2));
  console.log('Done!\n');
}

function prepareCategories(json) {
  console.log('Preparing categories.');
  console.log(`Found ${json.categories.length} categories.`);
  const categories = json.categories.map((category, i) => {
    category = Object.assign({}, category);
    delete category.sync_state;
    delete category.model_state;
    delete category.sort_order;
    const bcFormat = {
      categoryTableID: Date.now() + i,
      childCategoryName: category.title,
      parentCategoryID: 6,
      budgetAmount: 0,
      budgetPeriod: 3,
      budgetEnabledCategoryChild: 0
    };
    return {
      fin: category,
      bc: bcFormat
    };
  });

  const filepath = path.join(OUT_DIR, 'categories.json');
  console.log(`Writing pre-processed categories to ${filepath}`);
  fs.writeFileSync(filepath, JSON.stringify(categories, void 0, 2));
  console.log('Done!\n');
}

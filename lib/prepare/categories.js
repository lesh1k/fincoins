const fs = require('fs');
const CONFIG = require('../config');

async function prepareCategories(json) {
  console.log('Preparing categories.');
  console.log(`Found ${json.categories.length} categories.`);
  const categories = json.categories.map((cat, i) => {
    const category = Object.assign({}, cat);
    delete category.sync_state;
    delete category.model_state;
    delete category.sort_order;
    const bcFormat = {
      categoryTableID: Date.now() + i,
      childCategoryName: category.title,
      parentCategoryID: 6,
      budgetAmount: 0,
      budgetPeriod: 3,
      budgetEnabledCategoryChild: 0,
      childCategoryIcon: null,
    };
    return {
      fin: category,
      bc: bcFormat,
    };
  });

  const filepath = CONFIG.PREPARE.OUT.CATEGORIES;
  console.log(`Writing pre-processed categories to ${filepath}`);
  await fs.promises.writeFile(filepath, JSON.stringify(categories, undefined, 2));
  console.log('Done!\n');
}

module.exports = prepareCategories;

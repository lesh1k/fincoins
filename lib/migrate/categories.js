const fs = require('fs');
const CONFIG = require('../config');
const database = require('../db');

async function insertCategories() {
  console.log('\nInserting categories...');
  const categoriesJson = await fs.promises.readFile(CONFIG.INPUT.CATEGORIES);
  const categories = JSON.parse(categoriesJson);
  categories.forEach((cat) => {
    const columnsCount = Object.keys(cat.bc).length;
    const values = Object.values(cat.bc);
    database.insert('CHILDCATEGORYTABLE', values, columnsCount);
  });
  console.log('Done.');
}

module.exports = insertCategories;

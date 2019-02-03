const fs = require('fs');
const CONFIG = require('../config');
const database = require('../db');

async function insertTags() {
  console.log('\nInserting tags...');
  const tagsJson = await fs.promises.readFile(CONFIG.INPUT.TAGS);
  const tags = JSON.parse(tagsJson);
  tags.forEach((tag) => {
    const columnsCount = Object.keys(tag.bc).length;
    const values = Object.values(tag.bc);
    database.insert('LABELSTABLE', values, columnsCount);
  });
  console.log('Done.');
}

module.exports = insertTags;

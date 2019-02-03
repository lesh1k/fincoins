const fs = require('fs');
const CONFIG = require('../config');

async function prepareTags(json) {
  console.log('Preparing tags.');
  console.log(`Found ${json.tags.length} tags.`);
  const tags = json.tags.map((t, i) => {
    const tag = Object.assign({}, t);
    delete tag.sync_state;
    delete tag.model_state;
    const bcFormat = {
      labelsTableID: Date.now() + i,
      labelName: tag.title,
      transactionIDLabels: null,
    };
    return {
      fin: tag,
      bc: bcFormat,
    };
  });

  const filepath = CONFIG.PREPARE.OUT.TAGS;
  console.log(`Writing pre-processed tags to ${filepath}`);
  await fs.promises.writeFile(filepath, JSON.stringify(tags, undefined, 2));
  console.log('Done!\n');
}

module.exports = prepareTags;

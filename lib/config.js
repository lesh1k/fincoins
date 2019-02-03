const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../');

const CONFIG = {
  BASE: 'MDL',
  START_DATE: null, // The date of the first transaction if you know it
  END_DATE: null, // The date of the last transaction if you know it
  PREPARE: {
    // These should be set to actual paths
    FINANCIUS_BACKUP: path.resolve(ROOT_DIR, 'data/in/financius.json'),
    BLUECOINS_EMPTY_DB: path.resolve(ROOT_DIR, 'data/in/bc.fydb'),
    //  Below are not expected to be edited  //
    OUT: {
      DIR: path.resolve(ROOT_DIR, 'data/pre'),
      TRANSACTIONS: path.resolve(ROOT_DIR, 'data/pre/transactions.json'),
      ACCOUNTS: path.resolve(ROOT_DIR, 'data/pre/accounts.json'),
      CATEGORIES: path.resolve(ROOT_DIR, 'data/pre/categories.json'),
      TAGS: path.resolve(ROOT_DIR, 'data/pre/tags.json'),
      FINANCIUS: path.resolve(ROOT_DIR, 'data/pre/financius.json'),
      BLUECOINS: path.resolve(ROOT_DIR, 'data/pre/bc.fydb'),
    },
  },
  get INPUT() {
    return this.PREPARE.OUT;
  },
  OUTPUT: {
    BLUECOINS: path.resolve(ROOT_DIR, 'data/out/bc.fydb'),
  },
};

module.exports = CONFIG;

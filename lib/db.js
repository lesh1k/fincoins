'use strict';

const Database = require('better-sqlite3');
let db;

function setup(dbPath) {
  db = new Database(dbPath);
  return db;
}

function insert(tableName, values, columns = '') {
  if (typeof columns === 'number') {
    if (values.length < columns) throw Error('Not enough values provided');
    columns = '';
  } else if (Array.isArray(columns)) {
    columns = `(${columns.join(',')})`;
  }

  const valuesTmpl = `(${Array(values.length + 1).join('?').split('').join(',')})`;
  const q = `INSERT INTO ${tableName} ${columns} VALUES ${valuesTmpl};`;
  const statement = db.prepare(q);
  const info = statement.run(values);
  return info;
}

module.exports = {
  setup,
  insert,
  db
};

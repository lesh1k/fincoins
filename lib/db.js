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

function update(tableName, columns, values, colSearch, valSearch) {
  const valuesTmpl = columns.map(c => `${c}=?`).join(',');
  const searchTmpl = colSearch.map(c => `${c}=?`).join(',');
  const q = `UPDATE ${tableName} SET ${valuesTmpl} WHERE ${searchTmpl};`;
  console.log(q);
  const statement = db.prepare(q);
  const info = statement.run(values.slice().concat(valSearch));
  return info;
}

module.exports = {
  setup,
  insert,
  update,
  db
};

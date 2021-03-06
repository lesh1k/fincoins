const Database = require('better-sqlite3');

let db;

function setup(dbPath) {
  db = new Database(dbPath);
  return db;
}

function insert(tableName, values, cols = '') {
  let columns = cols;
  if (typeof cols === 'number') {
    if (values.length < columns) throw Error('Not enough values provided');
    columns = '';
  } else if (Array.isArray(cols)) {
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
  const statement = db.prepare(q);
  const info = statement.run(values.slice().concat(valSearch));
  return info;
}

function select(tableName, column, value) {
  const q = `SELECT * FROM ${tableName} WHERE ${column}=?;`;
  const statement = db.prepare(q);
  const res = statement.get(value);
  return res;
}

module.exports = {
  setup,
  insert,
  update,
  select,
  db,
};

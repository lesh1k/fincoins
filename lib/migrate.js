'use strict';

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const OUT_DIR = path.resolve(__dirname, '../data/out');
const IN_DIR = path.resolve(__dirname, '../data/pre');

migrate();

function migrate() {
  const dbPath = path.join(OUT_DIR, 'bc.fydb');
  fs.copyFileSync(path.join(IN_DIR, 'bc.fydb'), dbPath);
  const db = new Database(dbPath);
  migrateAccounts(db);
  migrateCategories(db);
  migrateTags(db);
  db.close();
}

function migrateAccounts(db) {
  const accounts = require(path.join(IN_DIR, 'accounts.json'));
  for (const acc of accounts) {
    const tmpl = Array(Object.keys(acc.bc).length + 1).join('?').split('').join(',');
    console.log(`Creating account "${acc.fin.title}"`);
    const stmt = db.prepare(`INSERT INTO ACCOUNTSTABLE VALUES (${tmpl});`)
    stmt.run(Object.values(acc.bc));
  }
  console.log('Done creating accounts.\n');
}

function migrateCategories(db) {
  const categories = require(path.join(IN_DIR, 'categories.json'));
  for (const cat of categories) {
    const tmpl = Array(Object.keys(cat.bc).length + 1).join('?').split('').join(',');
    console.log(`Creating category "${cat.fin.title}"`);
    const stmt = db.prepare(`INSERT INTO CHILDCATEGORYTABLE VALUES (${tmpl});`)
    stmt.run(Object.values(cat.bc));
  }
  console.log('Done creating categories.\n');
}

function migrateTags(db) {
  const tags = require(path.join(IN_DIR, 'tags.json'));
  for (const tag of tags) {
    const tmpl = Array(Object.keys(tag.bc).length + 1).join('?').split('').join(',');
    console.log(`Creating label "${tag.fin.title}"`);
    const stmt = db.prepare(`INSERT INTO LABELSTABLE VALUES (${tmpl});`)
    stmt.run(Object.values(tag.bc));
  }
  console.log('Done creating tags.');
}

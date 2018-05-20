'use strict';

const fs = require('fs');
const bnm = fs.readFileSync('../exchange-rates/bnm-uah.csv').toString();
const ecb = fs.readFileSync('../exchange-rates/out.csv').toString();
console.log(bnm.substr(0, 100));
console.log(ecb.substr(0, 200));
// process.exit()

const ecbArr = ecb.trim().split('\n').map(s => s.trim().split(','));
const bnmArr = bnm.trim().split('\n').map(s => s.trim().replace(',', '.').split(';'));

ecbArr[0].push('UAH\n');
for (const row of ecbArr.slice(1)) {
    const date = row[0];
    const bnmRow = bnmArr.find(row => row[0] === date);
    row.push(bnmRow[1] + '\n');
}

const data = ecbArr.map(row => `${row.join(',').trim()}`).join('\n');
console.log(data.substr(0, 200));
fs.writeFileSync('../exchange-rates/out.csv', data);

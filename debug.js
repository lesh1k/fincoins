const t = require('./data/pre/transactions.json').map(t => t.fin);


// // Get acc names that were used in cross currency transfers
// console.log(
//   Array.from(
//     new Set(
//       [].concat(...t
//         .filter(
//           t => t.isTransfer && t.account_from_currency && t.account_to_currency && t.account_from_currency !== t.account_to_currency
//         ).map(
//           t => (
//             [t.account_from_name, t.account_to_name]
//           )
//         )
//       ))));

// Get all mastercard USD transactions
// const res = t.filter(t=> ([t.account_from_name, t.account_to_name].includes('Mastercard USD')));

const res = t.filter(t=>t.exchange_rate < 0)

console.log(res);

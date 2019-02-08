const fincoins = require('./');

(async () => {
  // console.log(await fincoins.dryRun());
  await fincoins.csv();
})();

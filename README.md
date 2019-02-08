# fincoins
NodeJS util to migrate Financius data to Bluecoins. You can use either the CSV Advanced import option OR
generate a SQLite DB from your data. The former method is suggested and proved to yield better results with
my data.  

# Warning  
Be aware that in my experience Financius did not always behave and I had to deal with
cases of duplicated transactions or odd exchange rates. My data spans over years 2015-2019,
and includes multiple accounts, some of which are hidden or long unused. Also, I used about
5-6 different currencies. With all the above, the import process is far from smooth and in
my case could not be fully completed successfully. Had to skip not-CONFIRMED transactions
and suffer from imprecisions due to currency exchange rates difference.

# Generating migration data  

## Setup  
1. `git clone https://github.com/lesh1k/fincoins`  
2. `cd fincoins`  
3. `npm install` OR `yarn install`  
4. In `./data/in` directory place your financius JSON backup, rename it to `financius.json`  
5. In Bluecoins, setup your base currency.  

NOTE: Make sure you are connected to the internet on the first run of the script, since it will generate a JSON with historical exchange rates.  
NOTE 2: There's also a [config](./lib/config.js) that you can use to update any of the paths.  

## [Suggested] Generate CSV per Bluecoins adavanced import CSV template  
1. Download the [Advanced CSV Template]( https://drive.google.com/open?id=19F7NynA6ec36jC1qIDjdSXQpfwlYnPvw) and move it to `./data/in/template.csv`.  
2. In Bluecoins create all accounts and make sure to set the correct currency for these.  
3. Go to `Bluecoins` -> `Settings` -> `Local backup` and do a `Backup to phone storage`. This `.fydb` will serve as a reset point in case the output is wrong and you need to adjust the script.  
4. Run the script e.g. `example.js`:
```js
const fincoins = require('./');

(async () => {
  await fincoins.csv();
})();
```  
Note that you can also `dry-run` the script with your data using `console.log(await fincoins.dryRun())` instead. This would print resulting accounts with name and balance.  
5. The generated CSV can be found in `./data/out/transactions.csv`. Copy the file to your phone and using `Bluecoins` -> `Settings` -> `Import Data` -> `Excel (.csv)`. Make sure to select `Advanced Version`. You might need to wait a while till the import completes.  
6. You can find skipped transactions (if any) in `./data/out/skipped.json`. Add these manually if needed.  
7. Done! (I suggest going to `Accounts` and verifying that everything is correct)  

NOTE: In case the results are slightly off, this is due to exchange rates difference (be happy it worked). In case these are wildly off, most probably there are some rogue transactions in your input set (same thing that happened to me). Try debugging and finding the culprit. The starting point could be `Bluecoins` -> `Accounts` -> `(Account with issues)` -> `List of transactions` -> `Chart` (here you should be able to see unexpected spikes and determine where it all went wrong.)

## Generate Bluecoins .fydb database  
**Beware: This method is the earlier approach and as of 2019-02-08 does not work (inserts transactions as transfers). Seems that Bluecoins DB was changed.**  
1. Go to `Bluecoins` -> `Settings` -> `Local backup` and do a `Backup to phone storage`. This `.fydb` will serve as the base for migration script.
2. Place the DB in `./data/in` directory and rename it to `bc.fydb`  
3. Run the script e.g. `example.js`:
```js
const fincoins = require('./');

(async () => {
  await fincoins.migrate();
})();

```  
4. Find the output in `./data/out/bc.fydb`. Copy it to your phone `Bluecoins/Database_Export`. Open Bluecoins app and in settings find `Local backup`, `Restore from phone storage`. Pick `bc.fydb`
5. You can find skipped transactions (if any) in `./data/out/skipped.json`. Add these manually if needed.  
6. Hopefully it worked))


# For developers.  
The code is dirty in certain parts of the project, mainly due to a one-time use nature of the script.  

# Further development  
Not really planning on updating the code any time soon, but it would be nice to make it work for any type of financius input, despite any erroneous transactions or odd exchange rates.

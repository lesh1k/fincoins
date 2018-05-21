# fincoins
NodeJS util to migrate Financius data to Bluecoins.


# Usage  
1. `git clone https://github.com/lesh1k/fincoins`  
2. `cd fincoins`  
3. `npm install` OR `yarn install`  
4. In `./data/in` directory place your financius JSON backup, rename it to `financius.json`  
5. In `./data/in` directory place an empty Bluecoins DB, rename it to `bc.fydb`  
6. In `./exchange-rates` create an `out.csv` that would contain up to date exchange rates. Keep in mind that I have used `MDL` as base currency and due to harder to find historical rates CSV, have used a CSV with base currency `EUR`, hence the math is focused on this. If your base currency is anything but `EUR`, then you should probably just replace `MDL` with `YOUR_CURRENCY_CODE` throughout the project.  
7. Run `node lib/prepare.js` (it will create some files in `./data/pre`) If an error is thrown, maybe `./data/pre` should be created  
8. Run `node lib/migrate.js` (it will create the output file in `./data/out`) If an error is thrown, maybe `./data/out` should be created  
9. Use the `./data/out/bc.fydb`. Copy it to your phone `Bluecoins/database_exports`. Open Bluecoins app and in settings find `Local backup`, `Restore from phone storage`. Pick `bc.fydb`
10. Hopefully it worked))

NOTE: To get a CSV with a large number of exchange rates try using `bin/update-rates.sh`. It will download a ZIP to current working dir.  
NOTE2: If you get big differences in actual account balance, manually update balance in `data/pre/accounts.json` to counteract the discrepancies. To this update in-between calling `prepare.js` and `migrate.js`  

## For developers.  
The code is quite dirty and hard to read. Since it was written for being used once,
it worked and proved to be good enough. If you'd like to improve the code, try creating some PRs
or just forking this repo.  

## Further development  
As most important changes I can name:  
- Refactor the code  
- Batch DB operations (current one-by-one approach works, but is really slow)  
- Automate exchange rates retrieval  
- Create a config file  
- Automate accounts balance adjustment  

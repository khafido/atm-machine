import * as http from 'http';
import { parse } from 'url';
import * as fs from 'fs';
import * as path from 'path';
import { atm } from './atm';
import { log } from 'console';

const port = 3003;

enum TRANSACTION_TYPE {
  WITHDRAW = "WITHDRAW",
  DEPOSIT = "DEPOSIT",
  TRANSFER = "TRANSFER"
}

const server = http.createServer((req, res) => {
  const { pathname } = parse(req.url || '', true);
  let data = '';

  req.on('data', (chunk) => {
    data += chunk;
  });

  req.on('end', async () => {

    if (pathname === '/login') {
      const { accountNumber, pin } = JSON.parse(data);
      try {
        const account = await atm.authenticate(accountNumber, pin);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, account }));
      } catch (error: unknown) {
        if (error instanceof Error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: error.message }));
        }
      }
    } else if (pathname === '/balance') {
      try {
        const account = await atm.getLoggedInAccount() || null;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        if (account) {
          res.end(JSON.stringify({ success: true, balance: account.balance }));
        } else {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Please Log In First!' }));
        }
      } catch (error) {
        if (error instanceof Error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: error.message }));
        }
      }
    } else if (pathname === '/withdraw') {
      const { amount } = JSON.parse(data);
      try {
        const account = await atm.getLoggedInAccount();
        if (account) {
          await atm.withdraw(account, amount);
          await atm.saveTransactionHistory({
            type: TRANSACTION_TYPE.WITHDRAW,
            amount: amount,
            date: new Date().toString(),
            description: '-'
          });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, balance: account.balance }));
        } else {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Please Log In First!' }));
        }
      } catch (error) {
        if (error instanceof Error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: error.message }));
        }
      }
    } else if (pathname === '/deposit') {
      const { amount } = JSON.parse(data);

      try {
        const account = await atm.getLoggedInAccount();
        if (account) {
          if (amount > 0) {
            await atm.deposit(account, amount);
            await atm.saveTransactionHistory({
              type: TRANSACTION_TYPE.DEPOSIT,
              amount: amount,
              date: new Date().toString(),
              description: '-'
            });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, balance: account.balance }));
          } else {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end({ success: false, error: 'Invalid deposit amount' });
          }
        } else {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Please Log In First!' }));
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: error.message }));
        }
      }
    } else if (pathname === '/transfer') {
      const { destinationAccountNumber, amount } = JSON.parse(data);

      try {
        const sourceAccount = await atm.getLoggedInAccount();
        const destinationAccount = await atm.findAccountByAccountNumber(destinationAccountNumber);

        if (sourceAccount) {
          if (amount > 0 && amount <= sourceAccount.balance) {
            sourceAccount.balance -= amount;
            destinationAccount.balance += parseFloat(amount);
            await atm.saveTransactionHistory({
              type: TRANSACTION_TYPE.TRANSFER,
              amount: amount,
              date: new Date().toString(),
              description: `destinationAccountNumber: ${destinationAccountNumber}`
            });
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, balance: sourceAccount.balance, destinationAccount: destinationAccount.accountNumber }));
          } else {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Invalid transfer amount or insufficient balance' }));
          }
        } else {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Please Log In First!' }));
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: error.message }));
        }
      }
    } else if (req.method == 'GET' && pathname === '/download') {
      const currentAccount = atm.getLoggedInAccount;
      if (currentAccount !== null) {
        const csvData = atm.generateTransactionHistory();
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=transaction_history.csv');
        res.write(csvData);
        res.end();
      } else {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end({ success: false, error: 'No user logged in' });
      }
    } else if(pathname === '/transaction_history') {
      const currentAccount = atm.getLoggedInAccount;
      if (currentAccount !== null) {
        const transactionHistoryData = atm.getTransactionHistory();
        console.log({transactionHistoryData});
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: transactionHistoryData }));
      } else {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end({ success: false, error: 'No user logged in' });
      }
    }else {
      const htmlPath = path.join(__dirname, 'public', 'index.html');
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(htmlContent);
    }
  });
});

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

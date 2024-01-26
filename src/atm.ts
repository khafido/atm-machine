import { EventEmitter } from 'events';
import { Account } from './account';
import fs from 'fs';

interface TransactionHistory {
  type: string,
  date: string,
  description: string,
  amount: string
}

class ATM extends EventEmitter {
  private accounts: Record<string, Account> = {};
  private loggedInAccount: Account | null = null;
  private dataFilePath: string = 'src/accounts.json';
  private transactionHistoryDataPath: string = 'src/transactionHistory.json';
  private transactionHistoryFilePath: string = 'src/public/transactionHistory.csv';

  constructor() {
    super();
    this.loadAccounts();
    this.clearTransactionHistory();
  }

  private clearTransactionHistory(): void {
    fs.writeFileSync(this.transactionHistoryDataPath, JSON.stringify([]), 'utf8');
  }

  saveTransactionHistory(history: TransactionHistory): void {
    let transactionHistoryData = JSON.parse(fs.readFileSync(this.transactionHistoryDataPath, 'utf8'));
    transactionHistoryData.push(history);
    
    fs.writeFileSync(this.transactionHistoryDataPath, JSON.stringify(transactionHistoryData), 'utf8');
  }
  
  generateTransactionHistory(): String {
    let content = 'Type,Amount,Date,Description\n';
    const transactionHistoryData = JSON.parse(fs.readFileSync(this.transactionHistoryDataPath, 'utf8'));
    transactionHistoryData.map((h: TransactionHistory) => {
      content += `${h.type},${h.amount},${h.date},${h.description}\n`;
    })
    return content;
  }
  
  private loadAccounts(): void {
    try {
      const data = fs.readFileSync(this.dataFilePath, 'utf8');
      const accounts = JSON.parse(data);
      
      accounts.map((a: Account) => {
        this.accounts[a.accountNumber] = a
      })
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log(error.message);
      }
      // If the file doesn't exist or there is an error parsing it, ignore and use an empty accounts object.
      this.accounts = {};
    }
  }

  // private saveAccounts(): void {
  //   fs.writeFileSync(this.dataFilePath, JSON.stringify(this.accounts, null, 2), 'utf8');
  // }

  // createAccount(accountNumber: string, pin: string, initialBalance: number): void {
  //   this.accounts[accountNumber] = { accountNumber, pin, balance: initialBalance };
  //   this.saveAccounts();
  // }

  authenticate(accountNumber: string, pin: string): Promise<Account> {
    return new Promise((resolve, reject) => {
      process.nextTick(() => {
        const account = this.accounts[accountNumber];
        
        if (account && account.pin === pin) {
          this.loggedInAccount = account;
          resolve(account);
        } else {
          reject(new Error('Invalid credentials'));
        }
      });
    });
  }

  withdraw(account: Account, amount: number): Promise<void> {
    return new Promise((resolve, reject) => {
      process.nextTick(() => {
        if (amount > 0 && amount <= account.balance) {
          account.balance -= amount;
          // this.saveAccounts();
          resolve();
        } else {
          reject(new Error('Invalid withdrawal amount'));
        }
      });
    });
  }

  deposit(account: Account, amount: string): Promise<void> {  
    return new Promise((resolve, reject) => {
      process.nextTick(() => {
        account.balance += parseFloat(amount);
        // this.saveAccounts();
        resolve();
      });
    });
  }

  getLoggedInAccount(): Account | null {
    return this.loggedInAccount;
  }

  findAccountByAccountNumber(accountNumber: string): Account {
    return this.accounts[accountNumber];
  }

  getTransactionHistory(): Account[] | null {
    return JSON.parse(fs.readFileSync(this.transactionHistoryDataPath, 'utf8'));
  }
}

export const atm = new ATM();

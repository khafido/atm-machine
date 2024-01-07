const readline = require('readline');
const { displayMenu } = require('./menu');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const userPIN = "1234";

const sourceAccount = {
    balance: 1000000
}

const destinationAccount = {
    balance: 1000000
}

function validatePIN(inputPIN) {
    return inputPIN === userPIN;
}

function checkBalance() {
    console.log("Your balance: " + sourceAccount.balance);
}

function withdrawCash() {
    rl.question("Enter withdraw amount: ", (amount) => {
        if (amount > 0 && amount <= sourceAccount.balance) {
            sourceAccount.balance -= amount;
            console.log("Success withdraw " + amount);
            checkBalance();
            askingChoice();
        } else {
            console.log("Insufficient balance!");
        }
    });
}

function depositCash() {
    rl.question("Enter deposit amount: ", (amount) => {
        amount = parseFloat(amount);
        if (amount > 0) {
            sourceAccount.balance += amount;
            console.log("Success deposit " + amount);
            checkBalance();
            askingChoice();
        } else {
            console.log("Invalid deposit amount!");
        }
    });
}

function transferFunds() {
    rl.question("Enter transfer amount: ", (amount) => {
        amount = parseFloat(amount);
        if (amount > 0 && amount <= sourceAccount.balance) {
            sourceAccount.balance -= amount;
            destinationAccount.balance += amount;
            console.log("Success transfer " + amount);
            checkBalance();
            askingChoice();
        } else {
            console.log("Insufficient balance!");
        }
    });
}

function performAction(choice) {
    switch (choice) {
        case '1':
            checkBalance();
            break;
        case '2':
            withdrawCash();
            break;
        case '3':
            depositCash();
            break;
        case '4':
            transferFunds();
            break;
        case '5':
            console.log("See you again!");
            rl.close();
            break;
        default:
            console.log("Invalid choice. Please try again.");
            break;
    }
}

function askingChoice() {
    displayMenu();
    rl.question("Enter your choice: ", (choice) => {
        performAction(choice);
        if (choice == 1) {
            askingChoice();
        }
    });
}

function promptForPIN() {
    rl.question("Enter your PIN: ", (userPIN) => {
        if (validatePIN(userPIN)) {
            console.log("PIN correct! Welcome.");
            askingChoice();
        } else {
            console.log("Incorrect PIN. Please try again.");
            promptForPIN();
        }
    });
}

promptForPIN();

const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../data.json');

const defaultData = {
    users: [],
    transactions: [
        { _id: '1', userId: 'demo123', type: 'income', amount: 8000000, category: 'Top Up', description: 'Top Up Wallet', date: new Date().toISOString(), proofImage: null },
        { _id: '2', userId: 'demo123', type: 'expense', amount: 150000, category: 'Makanan', description: 'Makan Malam', date: new Date(Date.now() - 3600000).toISOString(), proofImage: null }
    ]
};

if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2));
}

const readDB = () => {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
};

const writeDB = (data) => {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

module.exports = { readDB, writeDB };

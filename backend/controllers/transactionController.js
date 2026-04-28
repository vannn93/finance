const { readDB, writeDB } = require('../utils/db');

exports.getTransactions = async (req, res) => {
    try {
        const db = readDB();
        // Since auth flow passes req.user from decode
        const userTransactions = db.transactions.filter(t => t.userId === req.user.id).sort((a,b) => new Date(b.date) - new Date(a.date));
        res.json(userTransactions);
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
};

exports.addTransaction = async (req, res) => {
    try {
        const { type, amount, category, description, proofImage } = req.body;
        
        const db = readDB();

        if (!['income', 'expense'].includes(type) || !amount || !category) {
            return res.status(400).json({ message: 'Data tidak lengkap atau tidak valid' });
        }

        const newTx = {
            _id: Date.now().toString(),
            userId: req.user.id,
            type,
            amount,
            category,
            description,
            date: new Date().toISOString(),
            proofImage: proofImage || null
        };

        db.transactions.push(newTx);
        writeDB(db);

        res.status(201).json(newTx);
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
};

exports.deleteTransaction = async (req, res) => {
    try {
        const db = readDB();
        const txIndex = db.transactions.findIndex(t => t._id === req.params.id && t.userId === req.user.id);
        
        if (txIndex === -1) {
            return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
        }
        
        db.transactions.splice(txIndex, 1);
        writeDB(db);

        res.json({ message: 'Transaksi berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
};
exports.deleteAllTransactions = async (req, res) => {
    try {
        const db = readDB();
        // Hanya hapus transaksi milik user yang login
        db.transactions = db.transactions.filter(t => t.userId !== req.user.id);
        writeDB(db);

        res.json({ message: 'Semua transaksi berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
};

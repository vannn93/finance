const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/request-otp', authController.requestOTP);
router.post('/verify-otp', authController.verifyOTP);

router.post('/request-register-otp', authController.requestRegisterOTP);
router.post('/verify-register-otp', authController.verifyRegisterOTP);

router.post('/register', authController.register);
router.post('/login', authController.login);

// Change PIN
router.post('/change-pin', require('../middleware/authMiddleware'), (req, res) => {
    const { readDB, writeDB } = require('../utils/db');
    const { oldPin, newPin } = req.body;
    if (!oldPin || !newPin || newPin.length < 6) {
        return res.status(400).json({ message: 'Data tidak lengkap atau PIN baru kurang dari 6 angka.' });
    }
    const db = readDB();
    const user = db.users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan.' });
    if (user.password !== oldPin) return res.status(400).json({ message: 'PIN lama tidak sesuai.' });
    user.password = newPin;
    writeDB(db);
    res.json({ message: 'PIN berhasil diubah.' });
});

// Demo mode - returns a real JWT for demo user
router.post('/demo', (req, res) => {
    const jwt = require('jsonwebtoken');
    const { readDB, writeDB } = require('../utils/db');
    
    const db = readDB();
    if (!db.users) db.users = [];
    
    let demoUser = db.users.find(u => u.username === 'demo');
    if (!demoUser) {
        demoUser = { id: 'demo123', username: 'demo', password: 'demo' };
        db.users.push(demoUser);
        writeDB(db);
    }
    
    const token = jwt.sign(
        { id: demoUser.id, username: 'demo', name: 'Demo User' }, 
        process.env.JWT_SECRET || 'secret', 
        { expiresIn: '1d' }
    );
    res.json({ token, user: { id: demoUser.id, username: 'demo', name: 'Demo User' } });
});

// Keep old paths around so existing frontend calls don't crash aggressively, but we won't use them.
// Actually, let's just use the strict new ones for cleanliness.

module.exports = router;

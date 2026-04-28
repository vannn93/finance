const { readDB, writeDB } = require('../utils/db');
const jwt = require('jsonwebtoken');
const wa = require('../utils/wa');

// Temporary in-memory OTP store (cleared on restart but good for dev)
const otps = {};

// Helper: apakah mode development?
const isDev = process.env.NODE_ENV !== 'production';


exports.requestRegisterOTP = async (req, res) => {
    try {
        const { phone, password } = req.body;
        if (!phone || !password) return res.status(400).json({ message: 'Data tidak lengkap.' });

        const db = readDB();
        const existingUser = db.users.find(u => u.username === phone); 
        if (existingUser) {
            return res.status(400).json({ message: 'Nomor ini sudah terdaftar. Silakan masuk.' });
        }

        const code = Math.floor(1000 + Math.random() * 9000).toString();
        otps[phone] = { code, password, type: 'register', expires: Date.now() + 5 * 60000 };

        // Coba kirim via WhatsApp
        if (wa.isReady) {
            try {
                await wa.sendOTP(phone, code);
                return res.json({ message: 'OTP Pendaftaran terkirim ke WhatsApp!' });
            } catch (waError) {
                console.error('[Auth] Gagal kirim WA:', waError.message);
            }
        }

        // Fallback: jika dev mode, kembalikan OTP di response
        if (isDev) {
            console.log(`[DEV FALLBACK] OTP untuk ${phone}: ${code}`);
            return res.json({
                message: `[DEV] WhatsApp belum tersambung. Kode OTP: ${code}`,
                devOTP: code
            });
        }

        const status = wa.getStatus ? wa.getStatus() : {};
        return res.status(503).json({
            message: `WhatsApp belum siap. Silakan scan QR di http://localhost:5000/qr lalu tunggu konfirmasi.`,
            waStatus: status
        });
    } catch (error) {
        res.status(500).json({ message: 'Error server.' });
    }
};

exports.verifyRegisterOTP = async (req, res) => {
    try {
        const { phone, otp } = req.body;
        const stored = otps[phone];

        if (!stored || stored.type !== 'register') return res.status(400).json({ message: 'Sesi tidak valid.' });
        if (Date.now() > stored.expires) return res.status(400).json({ message: 'OTP Kadaluarsa.' });
        if (stored.code !== otp) return res.status(400).json({ message: 'OTP Salah.' });

        const db = readDB();
        const newUser = {
            id: Date.now().toString(),
            username: phone,
            password: stored.password
        };

        db.users.push(newUser);
        writeDB(db);
        delete otps[phone];

        const token = jwt.sign({ id: newUser.id, username: newUser.username }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
        res.status(201).json({ token, user: { id: newUser.id, username: newUser.username } });
    } catch (error) {
        res.status(500).json({ message: 'Gagal verifikasi pendaftaran.' });
    }
};

exports.requestOTP = async (req, res) => {
    try {
        const { phone, password } = req.body;
        if (!phone || !password) return res.status(400).json({ message: 'Nomor WA dan PIN wajib diisi' });

        const db = readDB();
        const user = db.users.find(u => u.username === phone); 
        
        if (!user) {
            return res.status(404).json({ message: 'Nomor Anda belum terdaftar!' });
        }

        // VERIFIKASI PIN DISINI
        if (user.password !== password) {
            return res.status(401).json({ message: 'PIN yang Anda masukkan salah.' });
        }

        const code = Math.floor(1000 + Math.random() * 9000).toString();
        otps[phone] = { code, type: 'login', expires: Date.now() + 5 * 60000 };

        // Coba kirim via WhatsApp
        if (wa.isReady) {
            try {
                await wa.sendOTP(phone, code);
                return res.json({ message: 'PIN Benar! Kode OTP berhasil dikirim ke WhatsApp!' });
            } catch (waError) {
                console.error('[Auth] Gagal kirim WA:', waError.message);
            }
        }

        // Fallback dev mode
        if (isDev) {
            console.log(`[DEV FALLBACK] OTP untuk ${phone}: ${code}`);
            return res.json({
                message: `[DEV] WhatsApp belum tersambung. Kode OTP: ${code}`,
                devOTP: code
            });
        }

        const status = wa.getStatus ? wa.getStatus() : {};
        return res.status(503).json({
            message: 'WhatsApp belum siap. Silakan scan QR di http://localhost:5000/qr',
            waStatus: status
        });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        const { phone, otp } = req.body;
        const stored = otps[phone];

        if (!stored || stored.type !== 'login') return res.status(400).json({ message: 'Sesi OTP tidak ditemukan.' });
        if (Date.now() > stored.expires) return res.status(400).json({ message: 'Kode OTP kadaluarsa.' });
        if (stored.code !== otp) return res.status(400).json({ message: 'Kode OTP salah.' });

        delete otps[phone];

        const db = readDB();
        let user = db.users.find(u => u.username === phone); 
        if (!user) {
            return res.status(404).json({ message: 'Data pengguna tidak ditemukan.' });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, phone: user.username } });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan saat verifikasi server' });
    }
};

exports.register = async (req, res) => {
    try {
        const { username, password } = req.body;
        const db = readDB();

        const existingUser = db.users.find(u => u.username === username);
        if (existingUser) {
            return res.status(400).json({ message: 'Username/Nomor Handphone sudah terdaftar' });
        }

        const newUser = {
            id: Date.now().toString(),
            username,
            password 
        };

        db.users.push(newUser);
        writeDB(db);

        res.status(201).json({ message: 'User berhasil didaftarkan. Silakan login.' });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const db = readDB();

        const user = db.users.find(u => u.username === username);
        if (!user || user.password !== password) {
            return res.status(400).json({ message: 'Nomor atau PIN salah' });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, username: user.username } });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const db = readDB();

        const user = db.users.find(u => u.username === username);
        if (!user || user.password !== password) {
            return res.status(400).json({ message: 'Nomor atau PIN salah' });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, username: user.username } });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
};

const { readDB, writeDB } = require('../utils/db');
const jwt = require('jsonwebtoken');
const wa = require('../utils/wa');

// Temporary in-memory OTP store (cleared on restart but good for dev)
const otps = {};

// Helper: apakah mode development?
const isDev = process.env.NODE_ENV !== 'production' || process.env.DEV_MODE === 'true';

// Helper: normalisasi nomor telepon ke format 62...
const normalizePhone = (phone) => {
    let num = phone.replace(/\D/g, '').trim();
    if (num.startsWith('0')) {
        num = '62' + num.slice(1);
    } else if (num.startsWith('8')) {
        num = '62' + num;
    }
    return num;
};

// Helper: validasi nomor telepon Indonesia
const validatePhone = (phone) => {
    const num = phone.replace(/\D/g, '').trim();
    if (num.length < 10 || num.length > 15) return false;
    
    const normalized = normalizePhone(phone);
    // Nomor HP Indonesia umumnya 628...
    if (!normalized.startsWith('628')) return false;
    
    return true;
};


exports.requestRegisterOTP = async (req, res) => {
    try {
        let { phone, password, name } = req.body;
        if (!phone || !password) return res.status(400).json({ message: 'Data tidak lengkap.' });

        if (!validatePhone(phone)) {
            return res.status(400).json({ message: 'Nomor WhatsApp tidak valid. Gunakan format 0812... atau 812...' });
        }

        phone = normalizePhone(phone);
        const db = readDB();
        const existingUser = db.users.find(u => normalizePhone(u.username) === phone); 
        if (existingUser) {
            return res.status(400).json({ message: 'Nomor ini sudah terdaftar. Silakan masuk.' });
        }

        const code = Math.floor(1000 + Math.random() * 9000).toString();
        otps[phone] = { code, password, name, type: 'register', expires: Date.now() + 5 * 60000 };

        // Coba kirim via WhatsApp
        console.log(`[Auth] Meminta pengiriman OTP ke ${phone}. WA Ready: ${wa.isReady}`);
        if (wa.isReady) {
            try {
                await wa.sendOTP(phone, code);
                return res.json({ message: 'OTP Pendaftaran terkirim ke WhatsApp!' });
            } catch (waError) {
                console.error('[Auth] Gagal kirim WA:', waError.message);
                // Jangan langsung menyerah, biarkan lanjut ke dev fallback jika ada
            }
        } else {
            console.warn('[Auth] WhatsApp belum siap saat permintaan OTP pendaftaran.');
        }

        // Fallback: Jika WA tidak siap, beri tahu user

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
        let { phone, otp } = req.body;
        phone = normalizePhone(phone);
        const stored = otps[phone];

        if (!stored || stored.type !== 'register') return res.status(400).json({ message: 'Sesi tidak valid.' });
        if (Date.now() > stored.expires) return res.status(400).json({ message: 'OTP Kadaluarsa.' });
        if (stored.code !== otp) return res.status(400).json({ message: 'OTP Salah.' });

        const db = readDB();
        const newUser = {
            id: Date.now().toString(),
            username: phone,
            name: stored.name || 'User',
            password: stored.password
        };

        db.users.push(newUser);
        writeDB(db);
        delete otps[phone];

        const token = jwt.sign(
            { id: newUser.id, username: newUser.username, name: newUser.name }, 
            process.env.JWT_SECRET || 'secret', 
            { expiresIn: '7d' }
        );
        res.status(201).json({ token, user: { id: newUser.id, username: newUser.username, name: newUser.name } });
    } catch (error) {
        res.status(500).json({ message: 'Gagal verifikasi pendaftaran.' });
    }
};

exports.requestOTP = async (req, res) => {
    try {
        let { phone, password } = req.body;
        if (!phone || !password) return res.status(400).json({ message: 'Nomor WA dan PIN wajib diisi' });

        if (!validatePhone(phone)) {
            return res.status(400).json({ message: 'Nomor WhatsApp tidak valid.' });
        }

        phone = normalizePhone(phone);
        const db = readDB();
        const user = db.users.find(u => normalizePhone(u.username) === phone); 
        
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
        console.log(`[Auth] Meminta pengiriman OTP Login ke ${phone}. WA Ready: ${wa.isReady}`);
        if (wa.isReady) {
            try {
                await wa.sendOTP(phone, code);
                return res.json({ message: 'PIN Benar! Kode OTP berhasil dikirim ke WhatsApp!' });
            } catch (waError) {
                console.error('[Auth] Gagal kirim WA:', waError.message);
            }
        } else {
            console.warn('[Auth] WhatsApp belum siap saat permintaan OTP login.');
        }

        const status = wa.getStatus ? wa.getStatus() : {};
        return res.status(503).json({
            message: 'WhatsApp belum siap atau gagal mengirim pesan. Pastikan Anda sudah scan QR di http://localhost:5000/qr',
            waStatus: status
        });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        let { phone, otp } = req.body;
        phone = normalizePhone(phone);
        const stored = otps[phone];

        if (!stored || stored.type !== 'login') return res.status(400).json({ message: 'Sesi OTP tidak ditemukan.' });
        if (Date.now() > stored.expires) return res.status(400).json({ message: 'Kode OTP kadaluarsa.' });
        if (stored.code !== otp) return res.status(400).json({ message: 'Kode OTP salah.' });

        delete otps[phone];

        const db = readDB();
        let user = db.users.find(u => normalizePhone(u.username) === phone); 
        if (!user) {
            return res.status(404).json({ message: 'Data pengguna tidak ditemukan.' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, name: user.name || 'User' }, 
            process.env.JWT_SECRET || 'secret', 
            { expiresIn: '7d' }
        );
        res.json({ token, user: { id: user.id, phone: user.username } });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan saat verifikasi server' });
    }
};

exports.register = async (req, res) => {
    try {
        let { username, password } = req.body;
        username = normalizePhone(username);
        const db = readDB();

        const existingUser = db.users.find(u => normalizePhone(u.username) === username);
        if (existingUser) {
            return res.status(400).json({ message: 'Username/Nomor Handphone sudah terdaftar' });
        }

        const newUser = {
            id: Date.now().toString(),
            username,
            name: req.body.name || 'User',
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
        let { username, password } = req.body;
        username = normalizePhone(username);
        const db = readDB();

        const user = db.users.find(u => normalizePhone(u.username) === username);
        if (!user || user.password !== password) {
            return res.status(400).json({ message: 'Nomor atau PIN salah' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, name: user.name || 'User' }, 
            process.env.JWT_SECRET || 'secret', 
            { expiresIn: '7d' }
        );
        res.json({ token, user: { id: user.id, username: user.username } });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
};

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcodeImg = require('qrcode');
const fs = require('fs');
const path = require('path');

const QR_PATH = path.join(__dirname, '../qr.png');
const AUTH_PATH = path.join(__dirname, '../.wwebjs_auth');

let client = null;
let isReady = false;
let reconnectAttempts = 0;
let keepAliveInterval = null;
let isInitializing = false;

// ─── Clear session folder + qr image ────────────────────────────────────────
const clearSession = () => {
    try {
        if (fs.existsSync(QR_PATH)) fs.unlinkSync(QR_PATH);
    } catch (e) { /* ignore */ }
    try {
        if (fs.existsSync(AUTH_PATH)) {
            fs.rmSync(AUTH_PATH, { recursive: true, force: true });
            console.log('[WA] Session folder dihapus.');
        }
    } catch (e) {
        console.error('[WA] Gagal hapus session:', e.message);
    }
};

// ─── Stop keepAlive ping ─────────────────────────────────────────────────────
const stopKeepAlive = () => {
    if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
    }
};

// ─── Start keepAlive ping every 30s to prevent idle disconnect ───────────────
const startKeepAlive = () => {
    stopKeepAlive();
    keepAliveInterval = setInterval(async () => {
        if (!client || !isReady) return;
        try {
            await client.getState();
        } catch (e) {
            console.warn('[WA] KeepAlive ping gagal:', e.message);
        }
    }, 30000);
};

// ─── Build a new Client instance ─────────────────────────────────────────────
const buildClient = () => {
    return new Client({
        authStrategy: new LocalAuth({
            dataPath: AUTH_PATH
        }),
        puppeteer: {
            headless: true,
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-first-run',
                '--disable-extensions',
                '--disable-background-networking',
                '--disable-default-apps',
                '--disable-sync',
                '--metrics-recording-only',
                '--mute-audio',
                '--no-default-browser-check'
            ],
            timeout: 60000
        },
        qrMaxRetries: 5,          // Coba ulang QR sampai 5x sebelum menyerah
        authTimeoutMs: 120000,    // 2 menit timeout auth
        takeoverOnConflict: true, // Ambil alih sesi jika ada konflik
        takeoverTimeoutMs: 10000
    });
};

// ─── Main init ───────────────────────────────────────────────────────────────
const initializeClient = (forceClean = false) => {
    if (isInitializing) {
        console.log('[WA] Sudah dalam proses init, skip...');
        return;
    }

    isInitializing = true;
    isReady = false;
    module.exports.isReady = false;
    stopKeepAlive();

    if (forceClean) clearSession();
    // Hapus hanya file QR, bukan session
    if (fs.existsSync(QR_PATH)) {
        try { fs.unlinkSync(QR_PATH); } catch (e) { /* ignore */ }
    }

    console.log(`[WA] Initializing... (attempt #${reconnectAttempts + 1})`);

    client = buildClient();

    client.on('qr', async (qr) => {
        console.log('[WA] QR Code baru diterima. Menyimpan ke qr.png...');
        try {
            await qrcodeImg.toFile(QR_PATH, qr, { scale: 10 });
            console.log('[WA] QR tersimpan! Buka: http://localhost:5000/qr');
        } catch (err) {
            console.error('[WA] Gagal simpan QR:', err.message);
        }
    });

    client.on('loading_screen', (percent, message) => {
        console.log(`[WA] Loading: ${percent}% - ${message}`);
    });

    client.on('authenticated', () => {
        console.log('[WA] Authenticated berhasil!');
        reconnectAttempts = 0;
        // Hapus QR setelah auth
        if (fs.existsSync(QR_PATH)) {
            try { fs.unlinkSync(QR_PATH); } catch (e) { /* ignore */ }
        }
    });

    client.on('ready', () => {
        isReady = true;
        module.exports.isReady = true;
        isInitializing = false;
        reconnectAttempts = 0;
        console.log('[WA] ✅ WhatsApp SIAP! OTP bisa dikirim.');
        startKeepAlive();
    });

    client.on('auth_failure', (msg) => {
        console.error('[WA] ❌ Auth gagal:', msg);
        isReady = false;
        module.exports.isReady = false;
        isInitializing = false;
        console.log('[WA] Session rusak. Menghapus dan restart dengan QR baru...');
        // Paksa hapus session lama karena rusak
        scheduleReconnect(true);
    });

    client.on('disconnected', (reason) => {
        console.log('[WA] 🔌 Terputus:', reason);
        isReady = false;
        module.exports.isReady = false;
        isInitializing = false;
        stopKeepAlive();

        if (reason === 'LOGOUT') {
            // User logout manual → hapus session, perlu scan ulang
            console.log('[WA] User logout manual. Session dihapus.');
            scheduleReconnect(true);
        } else {
            // Koneksi putus karena internet/server → coba reconnect tanpa hapus session
            scheduleReconnect(false);
        }
    });

    client.initialize().catch(err => {
        console.error('[WA] ❌ Gagal initialize:', err.message);
        isInitializing = false;
        scheduleReconnect(err.message.includes('session') || err.message.includes('auth'));
    });
};

// ─── Reconnect dengan exponential backoff (max 60 detik) ────────────────────
const scheduleReconnect = (forceClean = false) => {
    reconnectAttempts++;
    const delay = Math.min(5000 * reconnectAttempts, 60000); // 5s, 10s, ... max 60s
    console.log(`[WA] Reconnect dalam ${delay / 1000}s... (forceClean: ${forceClean})`);

    if (client) {
        try { client.destroy().catch(() => {}); } catch (e) { /* ignore */ }
        client = null;
    }

    setTimeout(() => initializeClient(forceClean), delay);
};

// ─── Reset manual (dari HTTP endpoint) ──────────────────────────────────────
const resetClient = async () => {
    console.log('[WA] Manual reset diminta...');
    isInitializing = false;
    reconnectAttempts = 0;
    stopKeepAlive();

    if (client) {
        try { await client.destroy(); } catch (e) { /* ignore */ }
        client = null;
    }

    // Untuk reset manual, selalu hapus session agar QR baru muncul
    initializeClient(true);
};

// ─── Kirim OTP ───────────────────────────────────────────────────────────────
const sendOTP = async (targetNumber, code) => {
    if (!isReady || !client) {
        throw new Error(
            'WhatsApp belum terhubung. Scan QR di http://localhost:5000/qr lalu tunggu "WhatsApp SIAP".'
        );
    }

    // Format nomor
    let num = targetNumber.replace(/\D/g, '').trim();
    if (num.startsWith('0')) {
        num = '62' + num.slice(1);
    } else if (!num.startsWith('62')) {
        num = '62' + num;
    }

    const chatId = num + '@c.us';
    const message =
        '*🔐 AUTOWALLET - Kode OTP*\n\n' +
        'Kode OTP Anda: *' + code + '*\n\n' +
        '⏱️ Berlaku 5 menit.\n' +
        '🚫 JANGAN berikan kepada siapapun!';

    try {
        await client.sendMessage(chatId, message);
        console.log('[WA] ✅ OTP terkirim ke +' + num);
    } catch (err) {
        console.error('[WA] Gagal kirim:', err.message);
        // Cek apakah koneksi masih valid
        isReady = false;
        module.exports.isReady = false;
        scheduleReconnect(false);
        throw new Error('Gagal kirim OTP. WhatsApp sedang reconnect, coba lagi dalam 30 detik.');
    }
};

// ─── Expose status ───────────────────────────────────────────────────────────
const getStatus = () => ({
    isReady,
    isInitializing,
    reconnectAttempts,
    hasQR: fs.existsSync(QR_PATH)
});

// ─── Start ───────────────────────────────────────────────────────────────────
initializeClient(false);

module.exports = { sendOTP, resetClient, getStatus, isReady };

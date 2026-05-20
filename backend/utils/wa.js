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

// Status object for better reference
const status = {
    isReady: false,
    isInitializing: false,
    reconnectAttempts: 0,
    hasQR: false
};

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
    const chromePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        path.join(process.env.LOCALAPPDATA || '', 'Google/Chrome/Application/chrome.exe'),
    ];

    let executablePath = null;
    for (const p of chromePaths) {
        if (fs.existsSync(p)) {
            executablePath = p;
            break;
        }
    }

    const puppeteerOptions = {
        headless: true,
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
    };

    if (executablePath) {
        console.log(`[WA] Using Chrome at: ${executablePath}`);
        puppeteerOptions.executablePath = executablePath;
    } else {
        console.warn('[WA] Chrome not found in standard paths. Attempting to use bundled Chromium...');
    }

    return new Client({
        authStrategy: new LocalAuth({
            dataPath: AUTH_PATH
        }),
        webVersionCache: {
            type: 'remote',
            remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
        },
        puppeteer: puppeteerOptions,
        qrMaxRetries: 5,
        authTimeoutMs: 120000,
        takeoverOnConflict: true,
        takeoverTimeoutMs: 10000,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    });
};

// ─── Main init ───────────────────────────────────────────────────────────────
const initializeClient = (forceClean = false) => {
    if (isInitializing) {
        console.log('[WA] Sudah dalam proses init, skip...');
        return;
    }

    isInitializing = true;
    status.isInitializing = true;
    isReady = false;
    status.isReady = false;
    stopKeepAlive();

    if (forceClean) clearSession();
    if (fs.existsSync(QR_PATH)) {
        try { fs.unlinkSync(QR_PATH); } catch (e) { /* ignore */ }
    }

    console.log(`[WA] Initializing... (attempt #${reconnectAttempts + 1})`);

    client = buildClient();

    client.on('qr', async (qr) => {
        console.log('[WA] QR Code received.');
        status.hasQR = true;
        try {
            await qrcodeImg.toFile(QR_PATH, qr, { scale: 10 });
            console.log('[WA] QR saved! View at: http://localhost:5000/qr');
        } catch (err) {
            console.error('[WA] Failed to save QR:', err.message);
        }
    });

    client.on('loading_screen', (percent, message) => {
        console.log(`[WA] Loading: ${percent}% - ${message}`);
    });

    client.on('authenticated', () => {
        console.log('[WA] Authenticated successfully!');
        reconnectAttempts = 0;
        status.reconnectAttempts = 0;
        if (fs.existsSync(QR_PATH)) {
            try { fs.unlinkSync(QR_PATH); } catch (e) { /* ignore */ }
        }
        status.hasQR = false;
    });

    client.on('ready', () => {
        isReady = true;
        status.isReady = true;
        isInitializing = false;
        status.isInitializing = false;
        reconnectAttempts = 0;
        status.reconnectAttempts = 0;
        console.log('[WA] ✅ WhatsApp READY!');
        startKeepAlive();
    });

    client.on('auth_failure', (msg) => {
        console.error('[WA] ❌ Auth failure:', msg);
        isReady = false;
        status.isReady = false;
        isInitializing = false;
        status.isInitializing = false;
        scheduleReconnect(true);
    });

    client.on('disconnected', (reason) => {
        console.log('[WA] 🔌 Disconnected:', reason);
        isReady = false;
        status.isReady = false;
        isInitializing = false;
        status.isInitializing = false;
        stopKeepAlive();

        if (reason === 'LOGOUT') {
            scheduleReconnect(true);
        } else {
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
    status.reconnectAttempts = reconnectAttempts;
    const delay = Math.min(5000 * reconnectAttempts, 60000);
    console.log(`[WA] Reconnect in ${delay / 1000}s... (forceClean: ${forceClean})`);

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

    // Standardize number for WhatsApp
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
        console.log(`[WA] Attempting to send OTP to ${num}...`);
        await client.sendMessage(chatId, message);
        console.log('[WA] ✅ OTP sent to +' + num);
    } catch (err) {
        console.error('[WA] Send failed:', err.message);
        // If it's a connection issue, mark as not ready
        if (err.message.includes('Session') || err.message.includes('close')) {
            isReady = false;
            status.isReady = false;
            scheduleReconnect(false);
        }
        throw new Error('Gagal kirim OTP via WhatsApp: ' + err.message);
    }
};

// ─── Expose status ───────────────────────────────────────────────────────────
const getStatus = () => ({ ...status });

// ─── Start ───────────────────────────────────────────────────────────────────
initializeClient(false);

// Clean up on exit
process.on('SIGINT', async () => {
    console.log('[WA] Shutting down...');
    if (client) await client.destroy();
    process.exit(0);
});

module.exports = { 
    sendOTP, 
    resetClient, 
    getStatus, 
    get isReady() { return isReady; } 
};

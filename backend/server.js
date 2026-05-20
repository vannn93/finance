const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const uploadRoutes = require('./routes/upload');
const adminRoutes = require('./routes/admin');

app.use('/admin', adminRoutes);

app.get('/qr', (req, res) => {
    const fs = require('fs');
    const qrPath = path.join(__dirname, 'qr.png');

    // Create a simple HTML wrapper to auto-refresh
    let html = `
        <html>
            <head>
                <title>WhatsApp Linking</title>
                <style>
                    body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #f0f2f5; margin:0; }
                    .card { background: white; padding: 2rem; border-radius: 1rem; shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
                    img { width: 250px; height: 250px; margin: 1rem 0; border: 1px solid #ddd; padding: 10px; border-radius: 10px; }
                    .status { font-weight: bold; margin-bottom: 1rem; }
                    button { background: #1880f0; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold; }
                    button:hover { background: #1569c7; }
                </style>
                <script>
                    setInterval(() => {
                        window.location.reload();
                    }, 10000);
                </script>
            </head>
            <body>
                <div class="card">
                    <h2>AutoWallet WhatsApp</h2>
    `;

    if (fs.existsSync(qrPath)) {
        html += `
            <p class="status">Scan QR Code di bawah dengan WhatsApp Anda:</p>
            <img src="/qr-image?t=${Date.now()}" />
            <p style="font-size: 0.8rem; color: #666;">Halaman ini otomatis me-refresh setiap 10 detik.</p>
        `;
    } else {
        html += `
            <p class="status" style="color: #f59e0b;">QR Code sedang dimuat atau WhatsApp sudah terhubung...</p>
            <p>Jika stuck, coba tekan tombol Reset di bawah.</p>
        `;
    }

    html += `
                    <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #eee; display: flex; flex-direction: column; gap: 10px;">
                        <button onclick="fetch('/api/wa-reset').then(() => setTimeout(() => window.location.reload(), 2000))">RESET KONEKSI</button>
                        <a href="/admin" style="text-decoration: none; color: #64748b; font-size: 0.8rem; font-weight: bold;">DASHBOARD ADMIN</a>
                    </div>
                </div>
            </body>
        </html>
    `;
    res.send(html);
});

// Actual image serving to avoid caching issues in the HTML wrapper
app.get('/qr-image', (req, res) => {
    const fs = require('fs');
    const qrPath = path.join(__dirname, 'qr.png');
    if (fs.existsSync(qrPath)) {
        res.setHeader('Cache-Control', 'no-store');
        res.sendFile(qrPath);
    } else {
        res.status(404).send('Not found');
    }
});

app.get('/api/wa-status', (req, res) => {
    const wa = require('./utils/wa');
    res.json({ isReady: wa.isReady });
});

app.get('/api/wa-reset', async (req, res) => {
    try {
        const wa = require('./utils/wa');
        await wa.resetClient();
        res.json({ message: 'WhatsApp sedang di-reset. Tunggu 5-10 detik lalu refresh halaman QR.' });
    } catch (err) {
        res.status(500).json({ message: 'Gagal reset WhatsApp', error: err.message });
    }
});

app.get('/api/wa-test', async (req, res) => {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ message: 'Masukkan parameter ?phone=nomor' });
    try {
        const wa = require('./utils/wa');
        await wa.sendOTP(phone, '1234');
        res.json({ message: 'Pesan test terkirim ke ' + phone });
    } catch (err) {
        res.status(500).json({ message: 'Gagal kirim test', error: err.message });
    }
});

// Quick Pocket Route
app.get('/api/pocket', require('./middleware/authMiddleware'), (req, res) => {
    const db = require('./utils/db').readDB();
    if (!db.pockets) db.pockets = [];
    const userPockets = db.pockets.filter(p => p.userId === req.user.id);
    res.json(userPockets);
});
app.post('/api/pocket', require('./middleware/authMiddleware'), (req, res) => {
    const db = require('./utils/db').readDB();
    if (!db.pockets) db.pockets = [];
    const newPocket = { _id: Date.now().toString(), userId: req.user.id, ...req.body };
    db.pockets.push(newPocket);
    require('./utils/db').writeDB(db);
    res.json(newPocket);
});

app.delete('/api/pocket/:id', require('./middleware/authMiddleware'), (req, res) => {
    const db = require('./utils/db').readDB();
    if (!db.pockets) db.pockets = [];
    const index = db.pockets.findIndex(p => p._id === req.params.id && p.userId === req.user.id);
    if (index !== -1) {
        db.pockets.splice(index, 1);
        require('./utils/db').writeDB(db);
        res.json({ message: 'Rekening dihapus' });
    } else {
        res.status(404).json({ message: 'Not found' });
    }
});

// Initialize WhatsApp Web Client
require('./utils/wa');

// AI Analysis dengan Gemini
app.post('/api/ai-analysis', require('./middleware/authMiddleware'), async (req, res) => {
    try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');

        // Memastikan env terbaru dibaca
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey || apiKey.includes('your-gemini') || apiKey.length < 10) {
            console.error('AI Analysis Error: GEMINI_API_KEY is missing or invalid in .env');
            return res.status(400).json({ message: 'GEMINI_API_KEY belum diatur dengan benar di .env' });
        }

        const db = require('./utils/db').readDB();
        const transactions = (db.transactions || []).filter(t => t.userId === req.user.id);

        if (transactions.length === 0) {
            return res.status(400).json({ message: 'Belum ada transaksi untuk dianalisis.' });
        }

        const income = transactions.filter(t => t.type === 'income').reduce((a, c) => a + c.amount, 0);
        const expense = transactions.filter(t => t.type === 'expense').reduce((a, c) => a + c.amount, 0);
        const catMap = {};
        transactions.filter(t => t.type === 'expense').forEach(t => {
            catMap[t.category] = (catMap[t.category] || 0) + t.amount;
        });
        const topCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const recentTx = transactions.slice(-10).map(t =>
            `[${t.type}] ${t.category}: Rp ${t.amount} - ${t.description || ''}`
        ).join('\n');

        const prompt = `Analisis data keuangan pengguna AutoWallet:
- Total Pemasukan: Rp ${income.toLocaleString('id-ID')}
- Total Pengeluaran: Rp ${expense.toLocaleString('id-ID')}
- Saldo: Rp ${(income - expense).toLocaleString('id-ID')}

Top Kategori:
${topCats.map(([cat, amt]) => `- ${cat}: Rp ${amt.toLocaleString('id-ID')}`).join('\n')}

Berikan analisis singkat (Bahasa Indonesia) dengan emoji:
1. 📊 Kondisi saat ini
2. ⚠️ Peringatan (jika ada)
3. 💡 Saran hemat konkret`;

        const genAI = new GoogleGenerativeAI(apiKey);
        // Menggunakan gemini-1.5-flash yang lebih stabil untuk akun free
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        console.log('Requesting Gemini analysis...');
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        console.log('Gemini analysis success!');

        res.json({ analysis: text });
    } catch (err) {
        console.error('Gemini API Error details:', err);
        const errorMessage = err.message?.includes('429')
            ? 'Kuota harian Gemini habis. Coba lagi beberapa saat lagi atau cek Google AI Studio.'
            : 'Gagal menganalisis. Pastikan API Key valid.';
        res.status(500).json({ message: errorMessage, detail: err.message });
    }
});

app.use('/auth', authRoutes);
app.use('/transactions', transactionRoutes);
app.use('/upload', uploadRoutes);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT} (Accessible on network)`);
});

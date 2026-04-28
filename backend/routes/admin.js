const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const db = require('../utils/db');

// UI Admin Page
router.get('/', (req, res) => {
    const data = db.readDB();
    const users = data.users || [];
    const txs = data.transactions || [];
    const dbFile = path.join(__dirname, '../data.json');
    
    const stats = {
        totalUsers: users.length,
        totalTxs: txs.length,
        totalSize: (fs.existsSync(dbFile) ? fs.statSync(dbFile).size / 1024 : 0).toFixed(2),
        uploadCount: fs.existsSync(path.join(__dirname, '../uploads')) ? fs.readdirSync(path.join(__dirname, '../uploads')).length : 0,
        cacheSize: fs.existsSync(path.join(__dirname, '../.wwebjs_cache')) ? fs.readdirSync(path.join(__dirname, '../.wwebjs_cache')).length : 0
    };

    let html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AutoWallet Admin Dashboard</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
            body { font-family: 'Plus Jakarta Sans', sans-serif; background: #f8fafc; color: #1e293b; }
            .glass-header { background: linear-gradient(135deg, #1880f0 0%, #0066cc 100%); }
            .card-ui { background: white; border-radius: 24px; border: 1px solid #f1f5f9; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
            .checkbox-custom { width: 1.2rem; height: 1.2rem; border-radius: 6px; border: 2px solid #e2e8f0; cursor: pointer; transition: all 0.2s; -webkit-appearance: none; appearance: none; position: relative; }
            .checkbox-custom:checked { background-color: #1880f0; border-color: #1880f0; }
            .checkbox-custom:checked::after { content: '✓'; position: absolute; color: white; font-size: 0.8rem; font-weight: 800; top: 50%; left: 50%; transform: translate(-50%, -50%); }
            .btn-primary { background: #1880f0; transition: all 0.2s; }
            .btn-primary:active { transform: scale(0.95); }
            .table-row-hover:hover { background: #f8fafc; }
        </style>
    </head>
    <body class="min-h-screen pb-20">
        <!-- Modern Header -->
        <header class="glass-header text-white pt-10 pb-20 px-6">
            <div class="max-w-7xl mx-auto flex justify-between items-center">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">💰</div>
                    <div>
                        <h1 class="text-2xl font-black tracking-tight">Backend Console</h1>
                        <p class="text-white/70 text-xs font-bold uppercase tracking-widest">Sistem Manajemen AutoWallet</p>
                    </div>
                </div>
                <div class="flex gap-3">
                    <button onclick="location.reload()" class="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all">
                        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    </button>
                    <a href="/qr" class="px-6 py-3 bg-white text-[#1880f0] rounded-2xl font-bold text-sm shadow-xl active:scale-95 transition-all">WhatsApp Gateway</a>
                </div>
            </div>
        </header>

        <main class="max-w-7xl mx-auto px-6 -mt-10">
            <!-- Summary Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div class="card-ui p-6">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">👥</div>
                        <div>
                            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total User</p>
                            <p class="text-2xl font-black">${stats.totalUsers}</p>
                        </div>
                    </div>
                </div>
                <div class="card-ui p-6">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">🧾</div>
                        <div>
                            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Transaksi</p>
                            <p class="text-2xl font-black">${stats.totalTxs}</p>
                        </div>
                    </div>
                </div>
                <div class="card-ui p-6">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center">📁</div>
                        <div>
                            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Media Files</p>
                            <p class="text-2xl font-black">${stats.uploadCount}</p>
                        </div>
                    </div>
                </div>
                <div class="card-ui p-6">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center">💾</div>
                        <div>
                            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">DB Size</p>
                            <p class="text-2xl font-black">${stats.totalSize} KB</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <!-- User List -->
                <div class="lg:col-span-8">
                    <div class="card-ui overflow-hidden">
                        <div class="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0">
                            <div>
                                <h3 class="font-black text-slate-800 tracking-tight">Manajemen User</h3>
                                <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pilih data untuk aksi massal</p>
                            </div>
                            <div id="bulkActions" class="hidden flex gap-2">
                                <button onclick="handleBulkDelete()" class="px-5 py-2.5 bg-red-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-red-100 flex items-center gap-2 active:scale-95 transition-all">
                                    <span>Hapus (<span id="selectedCount">0</span>)</span>
                                </button>
                            </div>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="w-full text-left">
                                <thead class="bg-slate-50/50">
                                    <tr class="text-[10px] text-slate-400 uppercase font-black tracking-widest">
                                        <th class="px-8 py-4 w-10">
                                            <input type="checkbox" id="selectAll" onchange="toggleSelectAll(this)" class="checkbox-custom">
                                        </th>
                                        <th class="px-4 py-4">Profil</th>
                                        <th class="px-4 py-4">Aktivitas</th>
                                        <th class="px-8 py-4 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-50">
                                    ${users.map(u => {
                                        const uid = u.id || u._id;
                                        const userTxs = txs.filter(t => t.userId === uid);
                                        return `
                                        <tr class="table-row-hover group">
                                            <td class="px-8 py-5">
                                                <input type="checkbox" name="userSelect" value="${uid}" onchange="updateSelection()" class="checkbox-custom">
                                            </td>
                                            <td class="px-4 py-5">
                                                <div class="flex items-center gap-3">
                                                    <div class="w-10 h-10 bg-[#f1f5f9] text-[#1880f0] rounded-xl flex items-center justify-center font-bold text-sm">
                                                        ${(u.name || 'U').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p class="font-bold text-sm text-slate-800">${u.name || 'Anonymous'}</p>
                                                        <p class="text-[11px] text-slate-400 font-medium">+62 ${u.phone}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td class="px-4 py-5 font-bold text-xs text-slate-500">
                                                ${userTxs.length} Transaksi
                                            </td>
                                            <td class="px-8 py-5 text-center">
                                                <button onclick="deleteUser('${uid}')" class="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                </button>
                                            </td>
                                        </tr>
                                        `;
                                    }).join('') || '<tr><td colspan="4" class="px-8 py-10 text-center opacity-50">Tidak ada data user terdaftar</td></tr>'}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Tools Side -->
                <div class="lg:col-span-4 space-y-6">
                    <div class="card-ui p-8">
                        <h3 class="font-black text-slate-800 mb-6 flex items-center gap-2 underline decoration-blue-200 decoration-4">
                            Sistem Utilitas
                        </h3>
                        <div class="flex flex-col gap-3">
                            <button onclick="cleanAction('cache')" class="w-full p-4 bg-slate-50 hover:bg-white hover:border-[#1880f0]/30 border border-transparent rounded-2xl text-left transition-all">
                                <p class="text-xs font-bold text-slate-800">Clear WA Cache</p>
                                <p class="text-[10px] text-slate-500 font-medium mt-0.5">Hapus ${stats.cacheSize} file sementara</p>
                            </button>
                            <button onclick="cleanAction('uploads')" class="w-full p-4 bg-slate-50 hover:bg-white hover:border-[#1880f0]/30 border border-transparent rounded-2xl text-left transition-all">
                                <p class="text-xs font-bold text-slate-800">Pembersihan Gambar</p>
                                <p class="text-[10px] text-slate-500 font-medium mt-0.5">Kosongkan folder /uploads</p>
                            </button>
                            <button onclick="cleanAction('txs')" class="w-full p-4 bg-slate-50 hover:bg-white hover:border-red-500/30 border border-transparent rounded-2xl text-left transition-all">
                                <p class="text-xs font-bold text-slate-800">Reset Semua Transaksi</p>
                                <p class="text-[10px] text-slate-500 font-medium mt-0.5">Semua histori user dihapus</p>
                            </button>
                        </div>
                    </div>

                    <div class="card-ui p-1 bg-red-50 border-red-50 shadow-none overflow-hidden">
                        <div class="p-7 bg-white/50 backdrop-blur rounded-[23px] text-center">
                            <p class="text-[10px] font-black text-red-500 uppercase tracking-widest mb-4 italic">Zona Berbahaya</p>
                            <button onclick="cleanAction('reset')" class="w-full py-4 bg-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-100 hover:bg-red-600 active:scale-95 transition-all">
                                Factory Reset Sistem
                            </button>
                        </div>
                    </div>
                    
                    <footer class="text-center py-4">
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">AutoWallet v1.2 Admin Panel</p>
                    </footer>
                </div>
            </div>
        </main>

        <script>
            function updateSelection() {
                const checkboxes = document.querySelectorAll('input[name="userSelect"]:checked');
                const bulkActions = document.getElementById('bulkActions');
                const selectedCount = document.getElementById('selectedCount');
                if (checkboxes.length > 0) {
                    bulkActions.classList.remove('hidden');
                    selectedCount.innerText = checkboxes.length;
                } else {
                    bulkActions.classList.add('hidden');
                }
            }
            function toggleSelectAll(master) {
                const checkboxes = document.querySelectorAll('input[name="userSelect"]');
                checkboxes.forEach(cb => cb.checked = master.checked);
                updateSelection();
            }
            async function handleBulkDelete() {
                const checkboxes = document.querySelectorAll('input[name="userSelect"]:checked');
                const ids = Array.from(checkboxes).map(cb => cb.value);
                if (!confirm('Hapus ' + ids.length + ' data user terpilih?')) return;
                try {
                    await fetch('/admin/users/bulk-delete', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ids })
                    });
                    location.reload();
                } catch (e) { alert('Gagal menghapus'); }
            }
            async function cleanAction(type) {
                let msg = 'Konfirmasi tindakan?';
                if (type === 'reset') msg = 'PENTING: SEMUA DATA AKAN DIHAPUS PERMANEN. LANJUT?';
                if (!confirm(msg)) return;
                try {
                    const res = await fetch('/admin/clean/' + type, { method: 'POST' });
                    const d = await res.json();
                    alert(d.message);
                    location.reload();
                } catch (e) { alert('Terjadi kesalahan'); }
            }
            async function deleteUser(id) {
                if (!confirm('Hapus pengguna ini?')) return;
                try {
                    await fetch('/admin/users/' + id, { method: 'DELETE' });
                    location.reload();
                } catch (e) { alert('Gagal menghapus'); }
            }
        </script>
    </body>
    </html>
    `;
    res.send(html);
});

// Admin Actions
router.post('/clean/:type', (req, res) => {
    const { type } = req.params;
    const data = db.readDB();
    try {
        if (type === 'cache') {
            const cacheDir = path.join(__dirname, '../.wwebjs_cache');
            if (fs.existsSync(cacheDir)) {
                fs.readdirSync(cacheDir).forEach(f => { if (f.endsWith('.html')) fs.unlinkSync(path.join(cacheDir, f)) });
            }
            return res.json({ message: 'Temp cache dibersihkan' });
        }
        if (type === 'uploads') {
            const uploadDir = path.join(__dirname, '../uploads');
            if (fs.existsSync(uploadDir)) {
                fs.readdirSync(uploadDir).forEach(f => fs.unlinkSync(path.join(uploadDir, f)));
            }
            return res.json({ message: 'Folder upload dibersihkan' });
        }
        if (type === 'txs') {
            db.writeDB({ ...data, transactions: [] });
            return res.json({ message: 'Log transaksi dihapus' });
        }
        if (type === 'reset') {
            db.writeDB({ users: [], transactions: [] });
            return res.json({ message: 'Sistem di-reset pabrik' });
        }
        res.status(400).json({ message: 'Aksi tidak dikenal' });
    } catch (e) { res.status(500).json({ message: e.message }) }
});

router.post('/users/bulk-delete', (req, res) => {
    const { ids } = req.body;
    const data = db.readDB();
    data.users = data.users.filter(u => !ids.includes(u.id) && !ids.includes(u._id));
    data.transactions = data.transactions.filter(t => !ids.includes(t.userId));
    db.writeDB(data);
    res.json({ message: 'Bulk delete berhasil' });
});

router.delete('/users/:id', (req, res) => {
    const data = db.readDB();
    data.users = data.users.filter(u => u.id !== req.params.id && u._id !== req.params.id);
    data.transactions = data.transactions.filter(t => t.userId !== req.params.id);
    db.writeDB(data);
    res.json({ message: 'User berhasil dihapus' });
});

module.exports = router;

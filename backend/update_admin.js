const fs = require('fs');
const path = './routes/admin.js';
let content = fs.readFileSync(path, 'utf8');

const newHtml = `
    <!DOCTYPE html>
    <html lang="id" class="dark">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AutoWallet Admin Dashboard</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
            tailwind.config = {
                darkMode: 'class',
                theme: {
                    extend: {
                        colors: {
                            darkBg: '#0f172a',
                            darkCard: '#1e293b',
                            primary: '#3b82f6',
                            primaryHover: '#2563eb'
                        },
                        fontFamily: {
                            sans: ['Inter', 'sans-serif'],
                        }
                    }
                }
            }
        </script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
            body { font-family: 'Inter', sans-serif; background-color: #0f172a; color: #f8fafc; }
            .card-ui { background: #1e293b; border-radius: 16px; border: 1px solid #334155; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            .checkbox-custom { width: 1.25rem; height: 1.25rem; border-radius: 4px; border: 2px solid #475569; cursor: pointer; transition: all 0.2s; -webkit-appearance: none; appearance: none; position: relative; background: #0f172a; }
            .checkbox-custom:checked { background-color: #3b82f6; border-color: #3b82f6; }
            .checkbox-custom:checked::after { content: '✓'; position: absolute; color: white; font-size: 0.8rem; font-weight: 800; top: 50%; left: 50%; transform: translate(-50%, -50%); }
            .table-row-hover:hover { background: #334155; }
            ::-webkit-scrollbar { width: 8px; height: 8px; }
            ::-webkit-scrollbar-track { background: #0f172a; }
            ::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }
            ::-webkit-scrollbar-thumb:hover { background: #64748b; }
        </style>
    </head>
    <body class="min-h-screen text-slate-200">
        <div class="flex h-screen overflow-hidden">
            <aside class="w-64 flex-shrink-0 bg-darkCard border-r border-slate-700 hidden md:flex flex-col">
                <div class="p-6 border-b border-slate-700 flex items-center gap-3">
                    <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-blue-500/20">💰</div>
                    <div>
                        <h1 class="text-lg font-bold tracking-tight text-white">AutoWallet</h1>
                        <p class="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">Admin Console</p>
                    </div>
                </div>
                <div class="p-4 flex-1 overflow-y-auto space-y-2">
                    <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">Menu Utama</p>
                    <a href="#" class="flex items-center gap-3 px-4 py-3 bg-blue-500/10 text-blue-400 rounded-xl font-medium transition-colors border border-blue-500/20">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                        Dashboard
                    </a>
                    <a href="/qr" target="_blank" class="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl font-medium transition-colors group">
                        <svg class="w-5 h-5 group-hover:text-green-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                        WhatsApp Gateway
                    </a>
                </div>
                <div class="p-4 border-t border-slate-700">
                    <button onclick="cleanAction('reset')" class="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-xl font-bold text-sm transition-all duration-300">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        Factory Reset
                    </button>
                </div>
            </aside>
            <main class="flex-1 flex flex-col h-screen overflow-y-auto bg-[#0f172a]">
                <header class="sticky top-0 z-10 bg-darkCard/80 backdrop-blur-md border-b border-slate-700 px-8 py-5 flex justify-between items-center">
                    <div>
                        <h2 class="text-xl font-bold text-white">Overview</h2>
                        <p class="text-sm text-slate-400">Sistem Manajemen AutoWallet</p>
                    </div>
                    <div class="flex items-center gap-4">
                        <button onclick="location.reload()" class="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700" title="Refresh Data">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                        </button>
                    </div>
                </header>
                <div class="p-8 space-y-8">
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div class="card-ui p-6 relative overflow-hidden group">
                            <div class="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                            <div class="flex items-start justify-between">
                                <div>
                                    <p class="text-sm font-medium text-slate-400 mb-1">Total Users</p>
                                    <h3 class="text-3xl font-bold text-white">${stats.totalUsers}</h3>
                                </div>
                                <div class="p-3 bg-blue-500/20 text-blue-400 rounded-xl">
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                                </div>
                            </div>
                        </div>
                        <div class="card-ui p-6 relative overflow-hidden group">
                            <div class="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                            <div class="flex items-start justify-between">
                                <div>
                                    <p class="text-sm font-medium text-slate-400 mb-1">Total Transaksi</p>
                                    <h3 class="text-3xl font-bold text-white">${stats.totalTxs}</h3>
                                </div>
                                <div class="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                </div>
                            </div>
                        </div>
                        <div class="card-ui p-6 relative overflow-hidden group">
                            <div class="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                            <div class="flex items-start justify-between">
                                <div>
                                    <p class="text-sm font-medium text-slate-400 mb-1">Media Files</p>
                                    <h3 class="text-3xl font-bold text-white">${stats.uploadCount}</h3>
                                </div>
                                <div class="p-3 bg-purple-500/20 text-purple-400 rounded-xl">
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                </div>
                            </div>
                        </div>
                        <div class="card-ui p-6 relative overflow-hidden group">
                            <div class="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                            <div class="flex items-start justify-between">
                                <div>
                                    <p class="text-sm font-medium text-slate-400 mb-1">DB Size</p>
                                    <h3 class="text-3xl font-bold text-white">${stats.totalSize} <span class="text-lg font-medium text-slate-500">KB</span></h3>
                                </div>
                                <div class="p-3 bg-orange-500/20 text-orange-400 rounded-xl">
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div class="lg:col-span-2 space-y-6">
                            <div class="card-ui overflow-hidden">
                                <div class="p-6 border-b border-slate-700 bg-darkCard flex justify-between items-center">
                                    <div>
                                        <h3 class="font-bold text-white">Daftar Pengguna</h3>
                                        <p class="text-xs text-slate-400 mt-1">Kelola data pengguna terdaftar</p>
                                    </div>
                                    <div id="bulkActions" class="hidden">
                                        <button onclick="handleBulkDelete()" class="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white rounded-lg font-semibold text-sm transition-all flex items-center gap-2">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                            Hapus (<span id="selectedCount">0</span>)
                                        </button>
                                    </div>
                                </div>
                                <div class="overflow-x-auto">
                                    <table class="w-full text-left border-collapse">
                                        <thead>
                                            <tr class="bg-slate-800/50 text-xs text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
                                                <th class="px-6 py-4 w-12 text-center">
                                                    <input type="checkbox" id="selectAll" onchange="toggleSelectAll(this)" class="checkbox-custom">
                                                </th>
                                                <th class="px-6 py-4">User Info</th>
                                                <th class="px-6 py-4">Status</th>
                                                <th class="px-6 py-4 text-center">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-slate-700">
                                            ${users.map(u => {
                                                const uid = u.id || u._id;
                                                const userTxs = txs.filter(t => t.userId === uid);
                                                return \`
                                                <tr class="table-row-hover transition-colors">
                                                    <td class="px-6 py-4 text-center">
                                                        <input type="checkbox" name="userSelect" value="\${uid}" onchange="updateSelection()" class="checkbox-custom">
                                                    </td>
                                                    <td class="px-6 py-4">
                                                        <div class="flex items-center gap-4">
                                                            <div class="w-10 h-10 bg-slate-700 text-slate-300 rounded-full flex items-center justify-center font-bold text-sm border border-slate-600 shadow-inner">
                                                                \${(u.name || 'U').charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p class="font-semibold text-sm text-slate-200">\${u.name || 'Anonymous'}</p>
                                                                <p class="text-xs text-slate-400 font-mono mt-0.5">+62 \${u.phone}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td class="px-6 py-4">
                                                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium \${userTxs.length > 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-700 text-slate-400 border border-slate-600'}">
                                                            \${userTxs.length > 0 ? '<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>' : ''}
                                                            \${userTxs.length} Transaksi
                                                        </span>
                                                    </td>
                                                    <td class="px-6 py-4 text-center">
                                                        <button onclick="deleteUser('\${uid}')" class="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20" title="Hapus User">
                                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m11 0 00-1 1v3M4 7h16"></path></svg>
                                                        </button>
                                                    </td>
                                                </tr>
                                                \`;
                                            }).join('') || '<tr><td colspan="4" class="px-6 py-12 text-center text-slate-500 text-sm">Belum ada data user yang terdaftar.</td></tr>'}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        <div class="lg:col-span-1 space-y-6">
                            <div class="card-ui p-6">
                                <h3 class="font-bold text-white mb-5 flex items-center gap-2">
                                    <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                    System Utilities
                                </h3>
                                <div class="flex flex-col gap-3">
                                    <button onclick="cleanAction('cache')" class="w-full p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-left transition-all group">
                                        <div class="flex justify-between items-center">
                                            <div>
                                                <p class="text-sm font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">Clear WA Cache</p>
                                                <p class="text-xs text-slate-500 mt-1">Hapus ${stats.cacheSize} file sementara</p>
                                            </div>
                                            <div class="w-8 h-8 rounded-full bg-slate-700 group-hover:bg-blue-500/20 flex items-center justify-center transition-colors">
                                                <svg class="w-4 h-4 text-slate-400 group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                            </div>
                                        </div>
                                    </button>
                                    <button onclick="cleanAction('uploads')" class="w-full p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-left transition-all group">
                                        <div class="flex justify-between items-center">
                                            <div>
                                                <p class="text-sm font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">Pembersihan Gambar</p>
                                                <p class="text-xs text-slate-500 mt-1">Kosongkan folder /uploads</p>
                                            </div>
                                            <div class="w-8 h-8 rounded-full bg-slate-700 group-hover:bg-blue-500/20 flex items-center justify-center transition-colors">
                                                <svg class="w-4 h-4 text-slate-400 group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                            </div>
                                        </div>
                                    </button>
                                    <button onclick="cleanAction('txs')" class="w-full p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-left transition-all group">
                                        <div class="flex justify-between items-center">
                                            <div>
                                                <p class="text-sm font-semibold text-slate-200 group-hover:text-orange-400 transition-colors">Reset Histori Transaksi</p>
                                                <p class="text-xs text-slate-500 mt-1">Hapus semua transaksi user</p>
                                            </div>
                                            <div class="w-8 h-8 rounded-full bg-slate-700 group-hover:bg-orange-500/20 flex items-center justify-center transition-colors">
                                                <svg class="w-4 h-4 text-slate-400 group-hover:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
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

content = content.replace(/let html = \`[\s\S]*?\`;/, 'let html = `' + newHtml + '`;');
fs.writeFileSync(path, content);

import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Download, Bot, X, Filter, ChevronDown, Sparkles, FileSpreadsheet, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import TransactionItem from '../components/ui/TransactionItem';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const fmt = (n) => new Intl.NumberFormat('id-ID').format(n);

// Group transaksi berdasarkan tanggal
function groupByDate(txs) {
    const groups = {};
    txs.forEach(tx => {
        const key = format(new Date(tx.date), 'dd MMMM yyyy', { locale: id });
        if (!groups[key]) groups[key] = [];
        groups[key].push(tx);
    });
    return groups;
}

const Activity = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all'); // all | income | expense
    const [showAI, setShowAI] = useState(false);
    const [aiText, setAiText] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [showFilter, setShowFilter] = useState(false);

    useEffect(() => { fetchTransactions(); }, []);

    const fetchTransactions = async () => {
        const isDemo = localStorage.getItem('isDemo') === 'true';
        if (isDemo) {
            const localData = JSON.parse(localStorage.getItem('demo_transactions') || '[]');
            setTransactions(localData);
            setLoading(false);
            return;
        }

        try {
            const { data } = await api.get('/transactions');
            setTransactions(Array.isArray(data) ? data : []);
        } catch { setTransactions([]); }
        finally { setLoading(false); }
    };

    // Filter & search
    const filtered = transactions.filter(t => {
        const matchSearch = (t.description || '').toLowerCase().includes(search.toLowerCase())
            || (t.category || '').toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === 'all' || t.type === filter;
        return matchSearch && matchFilter;
    });

    const grouped = groupByDate(filtered);

    const income = transactions.filter(t => t.type === 'income').reduce((a, c) => a + c.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((a, c) => a + c.amount, 0);

    // Export Excel
    const handleExport = () => {
        const rows = transactions.map(t => ({
            Tanggal: format(new Date(t.date), 'dd/MM/yyyy HH:mm'),
            Tipe: t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
            Kategori: t.category,
            Deskripsi: t.description || '-',
            Nominal: t.amount,
        }));

        const ws = XLSX.utils.json_to_sheet(rows);
        // Set column widths
        ws['!cols'] = [{ wch: 18 }, { wch: 12 }, { wch: 15 }, { wch: 25 }, { wch: 15 }];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Transaksi');

        // Summary sheet
        const summaryRows = [
            { Keterangan: 'Total Pemasukan', Nominal: income },
            { Keterangan: 'Total Pengeluaran', Nominal: expense },
            { Keterangan: 'Saldo Bersih', Nominal: income - expense },
        ];
        const ws2 = XLSX.utils.json_to_sheet(summaryRows);
        ws2['!cols'] = [{ wch: 20 }, { wch: 18 }];
        XLSX.utils.book_append_sheet(wb, ws2, 'Ringkasan');

        XLSX.writeFile(wb, `AutoWallet_${format(new Date(), 'dd-MM-yyyy')}.xlsx`);
    };

    // Analisis AI
    const handleAIAnalysis = async () => {
        setShowAI(true);
        if (aiText) return; // jangan fetch ulang kalau sudah ada
        setAiLoading(true);
        try {
            const { data } = await api.post('/api/ai-analysis');
            setAiText(data.analysis);
        } catch (err) {
            setAiText(err.response?.data?.message || 'Gagal mendapatkan analisis AI. Pastikan GEMINI_API_KEY sudah diatur.');
        } finally {
            setAiLoading(false);
        }
    };

    // Hapus Transaksi
    const handleDelete = async (id) => {
        if (!window.confirm('Hapus transaksi ini?')) return;
        const isDemo = localStorage.getItem('isDemo') === 'true';
        
        if (isDemo) {
            const localData = JSON.parse(localStorage.getItem('demo_transactions') || '[]');
            const updated = localData.filter(t => t._id !== id);
            localStorage.setItem('demo_transactions', JSON.stringify(updated));
            setTransactions(updated);
            return;
        }

        try {
            await api.delete(`/transactions/${id}`);
            setTransactions(prev => prev.filter(t => t._id !== id));
        } catch (err) {
            alert('Gagal menghapus transaksi');
        }
    };

    // Hapus Semua Transaksi
    const handleDeleteAll = async () => {
        if (!window.confirm('PERINGATAN: Hapus SEMUA riwayat transaksi? Tindakan ini tidak bisa dibatalkan.')) return;
        const isDemo = localStorage.getItem('isDemo') === 'true';
        
        if (isDemo) {
            localStorage.removeItem('demo_transactions');
            setTransactions([]);
            return;
        }

        try {
            await api.delete('/transactions/all');
            setTransactions([]);
        } catch (err) {
            alert('Gagal menghapus semua transaksi');
        }
    };

    // Render teks markdown sederhana
    const renderAI = (text) => {
        return text.split('\n').map((line, i) => {
            if (!line.trim()) return <div key={i} className="h-2" />;
            if (line.startsWith('**') && line.endsWith('**')) {
                return <p key={i} className="font-bold text-slate-800 text-sm mt-3">{line.replace(/\*\*/g, '')}</p>;
            }
            // Bold inline **text**
            const parts = line.split(/\*\*(.*?)\*\*/g);
            return (
                <p key={i} className="text-sm text-slate-600 leading-relaxed">
                    {parts.map((part, j) => j % 2 === 1 ? <strong key={j} className="text-slate-800">{part}</strong> : part)}
                </p>
            );
        });
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="w-8 h-8 border-4 border-[#1880f0] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pb-28 bg-[#f7f8fa] min-h-screen">

            {/* ─── Header ─── */}
            <div className="bg-white px-5 pt-5 pb-4 border-b border-slate-100 sticky top-0 z-30">
                <div className="flex justify-between items-center mb-3">
                    <h1 className="text-lg font-bold text-slate-800">Riwayat Transaksi</h1>
                    <div className="flex gap-2">
                        {/* Export Excel */}
                        <button
                            onClick={handleExport}
                            title="Export Excel"
                            className="w-9 h-9 bg-green-50 hover:bg-green-100 text-green-600 rounded-xl flex items-center justify-center transition-colors active:scale-90"
                        >
                            <FileSpreadsheet size={18} />
                        </button>
                        {/* Hapus Semua */}
                        {transactions.length > 0 && (
                            <button
                                onClick={handleDeleteAll}
                                title="Hapus Semua"
                                className="w-9 h-9 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center transition-colors active:scale-90"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                        {/* Analisis AI */}
                        <button
                            onClick={handleAIAnalysis}
                            title="Analisis AI"
                            className="w-9 h-9 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center transition-colors active:scale-90"
                        >
                            <Sparkles size={18} />
                        </button>
                    </div>
                </div>

                {/* Search bar */}
                <div className="flex gap-2">
                    <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:border-[#1880f0] transition-colors">
                        <Search size={15} className="text-slate-400 shrink-0" />
                        <input
                            type="text"
                            placeholder="Cari transaksi..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="flex-1 bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
                        />
                        {search && <button onClick={() => setSearch('')}><X size={14} className="text-slate-400" /></button>}
                    </div>
                    <button
                        onClick={() => setShowFilter(!showFilter)}
                        className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${showFilter ? 'bg-[#1880f0] border-[#1880f0] text-white' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
                    >
                        <Filter size={16} />
                    </button>
                </div>

                {/* Filter chips */}
                <AnimatePresence>
                    {showFilter && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            className="flex gap-2 mt-2 overflow-hidden">
                            {[['all', 'Semua'], ['income', '↑ Masuk'], ['expense', '↓ Keluar']].map(([val, label]) => (
                                <button key={val} onClick={() => setFilter(val)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${filter === val ? 'bg-[#1880f0] text-white border-[#1880f0]' : 'bg-white text-slate-500 border-slate-200'}`}>
                                    {label}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ─── Summary Strip ─── */}
            <div className="mx-4 mt-3 grid grid-cols-3 gap-2">
                <div className="bg-white rounded-2xl p-3 text-center border border-slate-100 shadow-sm">
                    <p className="text-[10px] text-slate-400 font-medium">Transaksi</p>
                    <p className="text-base font-extrabold text-slate-800">{transactions.length}</p>
                </div>
                <div className="bg-white rounded-2xl p-3 text-center border border-slate-100 shadow-sm">
                    <p className="text-[10px] text-green-500 font-medium">Masuk</p>
                    <p className="text-sm font-extrabold text-green-600">+{fmt(income)}</p>
                </div>
                <div className="bg-white rounded-2xl p-3 text-center border border-slate-100 shadow-sm">
                    <p className="text-[10px] text-red-400 font-medium">Keluar</p>
                    <p className="text-sm font-extrabold text-red-500">-{fmt(expense)}</p>
                </div>
            </div>

            {/* ─── Transaction List Grouped by Date ─── */}
            <div className="px-4 mt-3 space-y-3">
                {filtered.length === 0 ? (
                    <div className="bg-white rounded-2xl p-10 text-center border border-slate-100 shadow-sm">
                        <p className="text-3xl mb-2">🔍</p>
                        <p className="text-sm font-semibold text-slate-500">Tidak ada transaksi</p>
                        <p className="text-xs text-slate-400 mt-1">{search ? 'Coba kata kunci lain' : 'Belum ada riwayat'}</p>
                    </div>
                ) : (
                    Object.entries(grouped).map(([date, txs]) => {
                        const dayIncome = txs.filter(t => t.type === 'income').reduce((a, c) => a + c.amount, 0);
                        const dayExpense = txs.filter(t => t.type === 'expense').reduce((a, c) => a + c.amount, 0);
                        return (
                            <div key={date}>
                                {/* Date header */}
                                <div className="flex items-center justify-between mb-1.5 px-1">
                                    <p className="text-xs font-bold text-slate-500">{date}</p>
                                    <div className="flex gap-2 text-[10px] font-bold">
                                        {dayIncome > 0 && <span className="text-green-500">+{fmt(dayIncome)}</span>}
                                        {dayExpense > 0 && <span className="text-red-400">-{fmt(dayExpense)}</span>}
                                    </div>
                                </div>
                                {/* Cards */}
                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
                                    {txs.map(tx => (
                                        <div key={tx._id} className="px-4">
                                            <TransactionItem 
                                                transaction={tx} 
                                                onDelete={handleDelete}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* ─── AI Analysis Bottom Sheet ─── */}
            <AnimatePresence>
                {showAI && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowAI(false)}>
                        <motion.div
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                            className="bg-white w-full max-w-md rounded-t-3xl flex flex-col"
                            style={{ maxHeight: '88vh' }}
                            onClick={e => e.stopPropagation()}>

                            {/* Drag handle */}
                            <div className="flex justify-center pt-3 pb-1 shrink-0">
                                <div className="w-10 h-1 bg-slate-200 rounded-full" />
                            </div>

                            {/* Header */}
                            <div className="px-5 py-3 flex justify-between items-center border-b border-slate-100 shrink-0">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center">
                                        <Sparkles size={16} className="text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">Analisis AI</p>
                                        <p className="text-[10px] text-slate-400">Powered by Gemini</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => { setAiText(''); handleAIAnalysis(); }}
                                        className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center" title="Refresh">
                                        <Bot size={15} className="text-slate-500" />
                                    </button>
                                    <button onClick={() => setShowAI(false)}
                                        className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center">
                                        <X size={15} className="text-slate-500" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="overflow-y-auto px-5 py-4 pb-10 flex-1">
                                {aiLoading ? (
                                    <div className="flex flex-col items-center justify-center py-16 gap-4">
                                        <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                                        <p className="text-sm text-slate-400 font-medium">Gemini sedang menganalisis...</p>
                                    </div>
                                ) : aiText ? (
                                    <div className="space-y-1">
                                        {renderAI(aiText)}
                                    </div>
                                ) : null}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Activity;

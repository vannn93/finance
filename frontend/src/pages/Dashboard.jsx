import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    ArrowUpCircle, ArrowDownCircle, Plus, X,
    ChevronRight, Wallet, Target, Scissors,
    RefreshCw, Bell, PieChart, TrendingUp, TrendingDown,
    CreditCard, Check, Printer
} from 'lucide-react';
import jsPDF from 'jspdf';
import TransactionItem from '../components/ui/TransactionItem';

function getUserPayload() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return null;
        return JSON.parse(atob(token.split('.')[1]));
    } catch { return null; }
}

const fmt = (n) => new Intl.NumberFormat('id-ID').format(n);

const CATEGORIES = {
    income: ['Gaji', 'Freelance', 'Investasi', 'Hadiah', 'Penjualan', 'Lainnya'],
    expense: ['Makanan', 'Transport', 'Belanja', 'Tagihan', 'Hiburan', 'Kesehatan', 'Pendidikan', 'Lainnya']
};

const RATES = { USD: 0.000061, SGD: 0.000082, MYR: 0.00028, JPY: 0.0094 };
const FLAG = { USD: '🇺🇸', SGD: '🇸🇬', MYR: '🇲🇾', JPY: '🇯🇵' };

const Dashboard = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [modal, setModal] = useState(null); // 'tx' | 'budget' | 'split' | 'convert' | 'reminder' | 'chart'
    const [modalType, setModalType] = useState('expense');
    const [form, setForm] = useState({ amount: '', category: '', description: '' });
    const [submitting, setSubmitting] = useState(false);

    // Budget
    const [budget, setBudget] = useState(() => Number(localStorage.getItem('budget') || 0));
    const [budgetInput, setBudgetInput] = useState('');

    // Split Bill
    const [splitTotal, setSplitTotal] = useState('');
    const [splitCount, setSplitCount] = useState('2');
    const [splitDesc, setSplitDesc] = useState('');

    // Convert
    const [convertAmount, setConvertAmount] = useState('');
    const [convertTo, setConvertTo] = useState('USD');

    // Reminders
    const [reminders, setReminders] = useState(() => {
        try { return JSON.parse(localStorage.getItem('reminders') || '[]'); } catch { return []; }
    });
    const [reminderText, setReminderText] = useState('');
    const [reminderDate, setReminderDate] = useState('');

    const navigate = useNavigate();
    const payload = getUserPayload();
    const userName = payload?.name || 'User';
    const userPhone = payload?.username || '';
    const userId = payload?.id || 'anon';
    const avatarUrl = `https://api.dicebear.com/7.x/croodles/svg?seed=${userId}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
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

    const income = transactions.filter(t => t.type === 'income').reduce((a, c) => a + c.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((a, c) => a + c.amount, 0);
    const balance = income - expense;
    const budgetUsed = budget > 0 ? Math.min((expense / budget) * 100, 100) : 0;
    const budgetLeft = budget - expense;

    // Chart: category breakdown
    const catMap = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
        catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    });
    const catEntries = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const COLORS = ['bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-green-500', 'bg-pink-500'];

    const openTx = (type, cat = '') => {
        setModalType(type);
        setForm({ amount: '', category: cat || CATEGORIES[type][0], description: '' });
        setModal('tx');
    };

    const handleSubmitTx = async (e) => {
        e.preventDefault();
        if (!form.amount || Number(form.amount) <= 0) return;
        setSubmitting(true);

        const isDemo = localStorage.getItem('isDemo') === 'true';
        if (isDemo) {
            const localData = JSON.parse(localStorage.getItem('demo_transactions') || '[]');
            const newTx = { 
                _id: Date.now().toString(), 
                type: modalType, 
                amount: Number(form.amount),
                category: form.category,
                description: form.description || form.category,
                date: new Date().toISOString() 
            };
            const updated = [newTx, ...localData];
            localStorage.setItem('demo_transactions', JSON.stringify(updated));
            setTransactions(updated);
            setModal(null);
            setSubmitting(false);
            return;
        }

        try {
            await api.post('/transactions', {
                type: modalType, amount: Number(form.amount),
                category: form.category,
                description: form.description || form.category,
                date: new Date().toISOString(),
            });
            await fetchData();
            setModal(null);
        } catch (err) { console.error(err); }
        finally { setSubmitting(false); }
    };

    const saveBudget = () => {
        const val = Number(budgetInput);
        if (val > 0) { setBudget(val); localStorage.setItem('budget', val); setBudgetInput(''); }
        setModal(null);
    };

    const saveReminder = () => {
        if (!reminderText || !reminderDate) return;
        const newList = [...reminders, { id: Date.now(), text: reminderText, date: reminderDate, done: false }];
        setReminders(newList);
        localStorage.setItem('reminders', JSON.stringify(newList));
        setReminderText(''); setReminderDate('');
    };
    const toggleReminder = (id) => {
        const newList = reminders.map(r => r.id === id ? { ...r, done: !r.done } : r);
        setReminders(newList);
        localStorage.setItem('reminders', JSON.stringify(newList));
    };
    const deleteReminder = (id) => {
        const newList = reminders.filter(r => r.id !== id);
        setReminders(newList);
        localStorage.setItem('reminders', JSON.stringify(newList));
    };

    const handlePrintReceipt = () => {
        if (!splitTotal || Number(splitTotal) <= 0) return;
        
        const perPerson = Math.ceil(Number(splitTotal) / Number(splitCount));
        const doc = new jsPDF({
            unit: 'mm',
            format: [80, 140]
        });

        const now = new Date();
        const dateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        
        // Settings
        const centerX = 40;
        let y = 15;

        // Header - Brand
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(24, 128, 240);
        doc.text('AutoWallet', centerX, y, { align: 'center' });
        
        y += 6;
        doc.setFontSize(7);
        doc.setTextColor(120);
        doc.setFont('helvetica', 'normal');
        doc.text('SMART FINANCIAL ASSISTANT', centerX, y, { align: 'center' });
        
        y += 4;
        doc.setDrawColor(230);
        doc.setLineWidth(0.2);
        doc.line(10, y, 70, y);
        
        // Title
        y += 8;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(40);
        doc.text('STRUK SPLIT BILL', centerX, y, { align: 'center' });
        
        // Info Section
        y += 10;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100);
        
        doc.text('Tanggal', 10, y);
        doc.setTextColor(60);
        doc.text(dateStr, 70, y, { align: 'right' });
        
        y += 5;
        doc.setTextColor(100);
        doc.text('Waktu', 10, y);
        doc.setTextColor(60);
        doc.text(timeStr, 70, y, { align: 'right' });
        
        y += 5;
        doc.setTextColor(100);
        doc.text('Petugas', 10, y);
        doc.setTextColor(60);
        doc.text(`+62 ${userPhone}`, 70, y, { align: 'right' });

        y += 6;
        // Dashed Line
        doc.setLineDashPattern([1, 1], 0);
        doc.setDrawColor(200);
        doc.line(10, y, 70, y);
        doc.setLineDashPattern([], 0);
        
        // Description
        y += 8;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(40);
        doc.text(splitDesc || 'Transaksi Split Bill', 10, y);
        
        // Details Section
        y += 8;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text('Total Tagihan', 10, y);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(60);
        doc.text(`Rp ${fmt(splitTotal)}`, 70, y, { align: 'right' });
        
        y += 5;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100);
        doc.text('Dibagi Ke', 10, y);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(60);
        doc.text(`${splitCount} Orang`, 70, y, { align: 'right' });
        
        y += 8;
        // Total Highlight Box
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(10, y, 60, 15, 2, 2, 'F');
        
        y += 6;
        doc.setFontSize(8);
        doc.setTextColor(24, 128, 240);
        doc.setFont('helvetica', 'normal');
        doc.text('MASING-MASING BAYAR:', 40, y, { align: 'center' });
        
        y += 6;
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text(`Rp ${fmt(perPerson)}`, 40, y, { align: 'center' });
        
        // Footer
        y += 18;
        doc.setDrawColor(230);
        doc.line(10, y, 70, y);
        
        y += 6;
        doc.setFontSize(7);
        doc.setTextColor(150);
        doc.setFont('helvetica', 'italic');
        doc.text('Struk ini adalah bukti perhitungan resmi', centerX, y, { align: 'center' });
        y += 3.5;
        doc.text('dari layanan digital AutoWallet.', centerX, y, { align: 'center' });
        
        y += 10;
        doc.setFontSize(9);
        doc.setTextColor(24, 128, 240);
        doc.setFont('helvetica', 'bold');
        doc.text('TERIMA KASIH', centerX, y, { align: 'center' });
        
        // Border receipt (Optional but looks tidy)
        doc.setDrawColor(240);
        doc.setLineDashPattern([2, 2], 0);
        doc.rect(5, 5, 70, 130);

        doc.save(`Struk_AutoWallet_${Date.now()}.pdf`);
        toast.success('Struk berhasil dirapikan & diunduh!');
    };

    const activeReminders = reminders.filter(r => !r.done);

    // Quick menu items — all unique & functional
    const menuItems = [
        { icon: TrendingUp,  label: 'Catat Masuk',  bg: 'bg-green-50',  ic: 'text-green-600',  action: () => openTx('income') },
        { icon: TrendingDown,label: 'Catat Keluar', bg: 'bg-red-50',    ic: 'text-red-500',    action: () => openTx('expense') },
        { icon: Target,      label: 'Budget',       bg: 'bg-blue-50',   ic: 'text-blue-600',   action: () => setModal('budget') },
        { icon: Scissors,    label: 'Split Bill',   bg: 'bg-purple-50', ic: 'text-purple-600', action: () => setModal('split') },
        { icon: RefreshCw,   label: 'Konversi',     bg: 'bg-cyan-50',   ic: 'text-cyan-600',   action: () => setModal('convert') },
        { icon: Bell,        label: 'Pengingat',    bg: 'bg-yellow-50', ic: 'text-yellow-600', action: () => setModal('reminder'),
          badge: activeReminders.length },
        { icon: PieChart,    label: 'Pengeluaran',  bg: 'bg-orange-50', ic: 'text-orange-600', action: () => setModal('chart') },
        { icon: CreditCard,  label: 'Pocket',       bg: 'bg-slate-50',  ic: 'text-slate-600',  action: () => navigate('/pocket') },
    ];

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="w-8 h-8 border-4 border-[#1880f0] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-28 bg-[#f7f8fa] min-h-screen">

            {/* ─── Header ─── */}
            <div className="bg-white px-5 pt-5 pb-4 flex justify-between items-center border-b border-slate-100">
                <div>
                    <p className="text-[11px] text-slate-400 font-medium">Selamat datang 👋</p>
                    <p className="text-sm font-bold text-slate-800">{userName}</p>
                </div>
                <button onClick={() => navigate('/profile')}
                    className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#1880f0]/20 bg-blue-50">
                    <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                </button>
            </div>

            {/* ─── Balance Card ─── */}
            <div className="mx-4 mt-4 bg-gradient-to-br from-[#1880f0] to-[#0a4db5] rounded-[24px] p-5 text-white shadow-lg shadow-blue-200 relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-44 h-44 bg-white/10 rounded-full" />
                <div className="absolute right-6 -bottom-12 w-32 h-32 bg-white/10 rounded-full" />
                <div className="relative z-10">
                    <p className="text-[11px] text-blue-200 font-semibold uppercase tracking-widest mb-0.5">Total Saldo</p>
                    <h2 className="text-[32px] font-bold leading-none mb-1">Rp {fmt(balance)}</h2>
                    {budget > 0 && (
                        <div className="mt-2 mb-3">
                            <div className="flex justify-between text-[10px] text-blue-200 mb-1">
                                <span>Budget Bulan Ini</span>
                                <span>{budgetLeft >= 0 ? `Sisa Rp ${fmt(budgetLeft)}` : `Melebihi Rp ${fmt(-budgetLeft)}`}</span>
                            </div>
                            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${budgetUsed >= 90 ? 'bg-red-400' : budgetUsed >= 70 ? 'bg-yellow-400' : 'bg-green-400'}`}
                                    style={{ width: `${budgetUsed}%` }}
                                />
                            </div>
                        </div>
                    )}
                    <div className="flex gap-2 mt-4">
                        <div className="flex-1 bg-white/15 rounded-2xl p-2.5">
                            <p className="text-[9px] text-blue-200 font-medium mb-0.5">Pemasukan</p>
                            <p className="text-sm font-bold">Rp {fmt(income)}</p>
                        </div>
                        <div className="flex-1 bg-white/15 rounded-2xl p-2.5">
                            <p className="text-[9px] text-blue-200 font-medium mb-0.5">Pengeluaran</p>
                            <p className="text-sm font-bold">Rp {fmt(expense)}</p>
                        </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                        <button onClick={() => openTx('income')}
                            className="flex-1 bg-white text-[#1880f0] font-bold py-2.5 rounded-xl flex items-center justify-center gap-1 text-xs active:scale-95 transition-all">
                            <Plus size={14} /> Pemasukan
                        </button>
                        <button onClick={() => openTx('expense')}
                            className="flex-1 bg-white/20 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-1 text-xs active:scale-95 transition-all">
                            <ArrowDownCircle size={14} /> Pengeluaran
                        </button>
                    </div>
                </div>
            </div>

            {/* ─── Quick Menu Grid ─── */}
            <div className="mx-4 mt-4 bg-white rounded-[20px] p-4 shadow-sm border border-slate-100">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Menu Cepat</p>
                <div className="grid grid-cols-4 gap-3">
                    {menuItems.map((item, i) => {
                        const Icon = item.icon;
                        return (
                            <button key={i} onClick={item.action} className="flex flex-col items-center gap-1.5 active:scale-90 transition-transform relative">
                                {item.badge > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center z-10">
                                        {item.badge}
                                    </span>
                                )}
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${item.bg} ${item.ic}`}>
                                    <Icon size={22} strokeWidth={1.8} />
                                </div>
                                <span className="text-[10px] font-semibold text-slate-600 text-center leading-tight">{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ─── Transaksi Terkini ─── */}
            <div className="mx-4 mt-4">
                <div className="flex justify-between items-center mb-3">
                    <p className="text-sm font-bold text-slate-800">Transaksi Terkini</p>
                    <button onClick={() => navigate('/activity')} className="text-[11px] font-bold text-[#1880f0] flex items-center gap-0.5">
                        Lihat Semua <ChevronRight size={13} />
                    </button>
                </div>
                <div className="bg-white rounded-[20px] shadow-sm border border-slate-100 overflow-hidden">
                    {transactions.length === 0 ? (
                        <div className="text-center py-10">
                            <Wallet size={28} className="text-slate-300 mx-auto mb-2" />
                            <p className="text-sm font-semibold text-slate-400">Belum ada transaksi</p>
                            <button onClick={() => openTx('income')}
                                className="mt-3 bg-[#1880f0] text-white text-xs font-bold px-4 py-2 rounded-full">
                                + Mulai Catat
                            </button>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {transactions.slice(0, 5).map(tx => (
                                <div key={tx._id} className="px-4 py-1">
                                    <TransactionItem transaction={tx} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ════════════ MODALS ════════════ */}
            <AnimatePresence>
                {modal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 backdrop-blur-sm"
                        onClick={() => setModal(null)}>
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
                            <div className="overflow-y-auto px-6 pb-10 pt-3 flex-1">

                            {/* ── Modal: Tambah Transaksi ── */}
                            {modal === 'tx' && (
                                <>
                                    <div className="flex justify-between items-center mb-5">
                                        <div className="flex gap-2">
                                            <button onClick={() => setModalType('income')}
                                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${modalType === 'income' ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                + Pemasukan
                                            </button>
                                            <button onClick={() => setModalType('expense')}
                                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${modalType === 'expense' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                − Pengeluaran
                                            </button>
                                        </div>
                                        <button onClick={() => setModal(null)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                                            <X size={15} className="text-slate-500" />
                                        </button>
                                    </div>
                                    <form onSubmit={handleSubmitTx} className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jumlah (Rp)</label>
                                            <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                                                className="w-full text-3xl font-bold text-slate-800 outline-none border-b-2 border-slate-200 focus:border-[#1880f0] pb-2 bg-transparent mt-1" placeholder="0" autoFocus required />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kategori</label>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {CATEGORIES[modalType].map(cat => (
                                                    <button key={cat} type="button" onClick={() => setForm({ ...form, category: cat })}
                                                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${form.category === cat ? 'bg-[#1880f0] text-white border-[#1880f0]' : 'bg-white text-slate-600 border-slate-200'}`}>
                                                        {cat}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Catatan</label>
                                            <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-[#1880f0] text-sm font-medium mt-1" placeholder="Opsional..." />
                                        </div>
                                        <button type="submit" disabled={submitting}
                                            className={`w-full py-4 rounded-2xl font-bold text-white text-sm active:scale-95 transition-all disabled:opacity-60 ${modalType === 'income' ? 'bg-green-500' : 'bg-red-500'}`}>
                                            {submitting ? 'Menyimpan...' : `Simpan ${modalType === 'income' ? 'Pemasukan' : 'Pengeluaran'}`}
                                        </button>
                                    </form>
                                </>
                            )}

                            {/* ── Modal: Budget Bulanan ── */}
                            {modal === 'budget' && (
                                <>
                                    <div className="flex justify-between items-center mb-5">
                                        <h2 className="text-lg font-bold text-slate-800">🎯 Budget Bulanan</h2>
                                        <button onClick={() => setModal(null)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center"><X size={15} /></button>
                                    </div>
                                    {budget > 0 && (
                                        <div className="bg-slate-50 rounded-2xl p-4 mb-4">
                                            <div className="flex justify-between text-sm font-semibold text-slate-700 mb-2">
                                                <span>Pengeluaran</span><span>Budget</span>
                                            </div>
                                            <div className="flex justify-between text-lg font-bold mb-2">
                                                <span className="text-red-500">Rp {fmt(expense)}</span>
                                                <span className="text-slate-800">Rp {fmt(budget)}</span>
                                            </div>
                                            <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${budgetUsed >= 90 ? 'bg-red-500' : budgetUsed >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${budgetUsed}%` }} />
                                            </div>
                                            <p className={`text-xs font-bold mt-2 ${budgetLeft >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                {budgetLeft >= 0 ? `✅ Sisa anggaran: Rp ${fmt(budgetLeft)}` : `⚠️ Melebihi budget: Rp ${fmt(-budgetLeft)}`}
                                            </p>
                                        </div>
                                    )}
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                                        {budget > 0 ? 'Ubah Budget' : 'Set Budget'}
                                    </label>
                                    <input type="number" value={budgetInput} onChange={e => setBudgetInput(e.target.value)}
                                        className="w-full text-2xl font-bold text-slate-800 outline-none border-b-2 border-slate-200 focus:border-[#1880f0] pb-2 bg-transparent mb-4" placeholder="Contoh: 3000000" />
                                    <button onClick={saveBudget} className="w-full bg-[#1880f0] text-white font-bold py-4 rounded-2xl text-sm">
                                        Simpan Budget
                                    </button>
                                </>
                            )}

                            {/* ── Modal: Split Bill ── */}
                            {modal === 'split' && (
                                <>
                                    <div className="flex justify-between items-center mb-5">
                                        <h2 className="text-lg font-bold text-slate-800">✂️ Split Bill</h2>
                                        <button onClick={() => setModal(null)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center"><X size={15} /></button>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Tagihan (Rp)</label>
                                            <input type="number" value={splitTotal} onChange={e => setSplitTotal(e.target.value)}
                                                className="w-full text-2xl font-bold text-slate-800 outline-none border-b-2 border-slate-200 focus:border-[#1880f0] pb-2 bg-transparent mt-1" placeholder="0" autoFocus />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jumlah Orang</label>
                                            <div className="flex items-center gap-3 mt-2">
                                                <button onClick={() => setSplitCount(s => String(Math.max(2, Number(s) - 1)))}
                                                    className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-xl font-bold">−</button>
                                                <span className="text-3xl font-bold text-slate-800 w-10 text-center">{splitCount}</span>
                                                <button onClick={() => setSplitCount(s => String(Number(s) + 1))}
                                                    className="w-10 h-10 bg-[#1880f0] text-white rounded-full flex items-center justify-center text-xl font-bold">+</button>
                                            </div>
                                        </div>
                                        <div className="bg-blue-50 rounded-2xl p-4 text-center mt-2">
                                            <p className="text-xs text-blue-500 font-semibold mb-1">Masing-masing bayar</p>
                                            <p className="text-3xl font-extrabold text-[#1880f0]">
                                                Rp {fmt(splitTotal ? Math.ceil(Number(splitTotal) / Number(splitCount)) : 0)}
                                            </p>
                                            <p className="text-xs text-blue-400 mt-1">
                                                {splitTotal ? `dari total Rp ${fmt(Number(splitTotal))} ÷ ${splitCount} orang` : 'Masukkan total tagihan di atas'}
                                            </p>
                                        </div>
                                        
                                        <div className="mt-4 space-y-3 pt-2 border-t border-slate-100">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Detail Struk (Opsional)</label>
                                            <input 
                                                type="text" 
                                                value={splitDesc} 
                                                onChange={e => setSplitDesc(e.target.value)}
                                                placeholder="Deskripsi tagihan (misal: Makan Malam)"
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#1880f0] text-sm font-medium"
                                            />
                                            
                                            <button 
                                                onClick={handlePrintReceipt}
                                                disabled={!splitTotal || Number(splitTotal) <= 0}
                                                className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-4 rounded-2xl text-sm hover:bg-black transition-all active:scale-[0.98] disabled:opacity-30 disabled:grayscale disabled:pointer-events-none"
                                            >
                                                <Printer size={18} /> Cetak Struk (PDF)
                                            </button>
                                            {!splitTotal && (
                                                <p className="text-[10px] text-center text-slate-400 font-medium italic">
                                                    *Isi nominal tagihan untuk mengaktifkan cetak struk
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* ── Modal: Konversi Mata Uang ── */}
                            {modal === 'convert' && (
                                <>
                                    <div className="flex justify-between items-center mb-5">
                                        <h2 className="text-lg font-bold text-slate-800">💱 Konversi Mata Uang</h2>
                                        <button onClick={() => setModal(null)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center"><X size={15} /></button>
                                    </div>
                                    <p className="text-xs text-slate-400 mb-4">*Kurs estimasi untuk referensi</p>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jumlah Rupiah (IDR)</label>
                                            <input type="number" value={convertAmount} onChange={e => setConvertAmount(e.target.value)}
                                                className="w-full text-2xl font-bold text-slate-800 outline-none border-b-2 border-slate-200 focus:border-[#1880f0] pb-2 bg-transparent mt-1" placeholder="0" autoFocus />
                                        </div>
                                        <div className="flex gap-2 flex-wrap">
                                            {Object.keys(RATES).map(cur => (
                                                <button key={cur} onClick={() => setConvertTo(cur)}
                                                    className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${convertTo === cur ? 'bg-[#1880f0] text-white border-[#1880f0]' : 'bg-white text-slate-600 border-slate-200'}`}>
                                                    {FLAG[cur]} {cur}
                                                </button>
                                            ))}
                                        </div>
                                        {convertAmount && Number(convertAmount) > 0 && (
                                            <div className="bg-blue-50 rounded-2xl p-4 text-center">
                                                <p className="text-xs text-blue-500 font-semibold mb-1">Rp {fmt(Number(convertAmount))} =</p>
                                                <p className="text-3xl font-extrabold text-[#1880f0]">
                                                    {(Number(convertAmount) * RATES[convertTo]).toFixed(2)} {convertTo}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* ── Modal: Pengingat Tagihan ── */}
                            {modal === 'reminder' && (
                                <>
                                    <div className="flex justify-between items-center mb-5">
                                        <h2 className="text-lg font-bold text-slate-800">🔔 Pengingat Tagihan</h2>
                                        <button onClick={() => setModal(null)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center"><X size={15} /></button>
                                    </div>
                                    <div className="space-y-3 mb-4">
                                        <input type="text" value={reminderText} onChange={e => setReminderText(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-[#1880f0] text-sm font-medium"
                                            placeholder="Nama tagihan (contoh: Token Listrik)" />
                                        <input type="date" value={reminderDate} onChange={e => setReminderDate(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-[#1880f0] text-sm font-medium" />
                                        <button onClick={saveReminder} className="w-full bg-[#1880f0] text-white font-bold py-3 rounded-xl text-sm">
                                            + Tambah Pengingat
                                        </button>
                                    </div>
                                    <div className="max-h-52 overflow-y-auto space-y-2">
                                        {reminders.length === 0 && <p className="text-xs text-slate-400 text-center py-4">Belum ada pengingat</p>}
                                        {reminders.map(r => (
                                            <div key={r.id} className={`flex items-center gap-3 p-3 rounded-xl ${r.done ? 'bg-green-50' : 'bg-orange-50'}`}>
                                                <button onClick={() => toggleReminder(r.id)}
                                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${r.done ? 'bg-green-500 border-green-500' : 'border-orange-400'}`}>
                                                    {r.done && <Check size={12} className="text-white" />}
                                                </button>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-xs font-bold truncate ${r.done ? 'line-through text-slate-400' : 'text-slate-700'}`}>{r.text}</p>
                                                    <p className="text-[10px] text-slate-400">{r.date}</p>
                                                </div>
                                                <button onClick={() => deleteReminder(r.id)} className="text-slate-300 hover:text-red-400">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {/* ── Modal: Analitik Pengeluaran ── */}
                            {modal === 'chart' && (
                                <>
                                    <div className="flex justify-between items-center mb-5">
                                        <h2 className="text-lg font-bold text-slate-800">📊 Breakdown Pengeluaran</h2>
                                        <button onClick={() => setModal(null)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center"><X size={15} /></button>
                                    </div>
                                    {catEntries.length === 0 ? (
                                        <div className="text-center py-8">
                                            <PieChart size={32} className="text-slate-300 mx-auto mb-2" />
                                            <p className="text-sm text-slate-400 font-medium">Belum ada data pengeluaran</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="text-right text-xs text-slate-400 font-medium mb-2">
                                                Total: Rp {fmt(expense)}
                                            </div>
                                            {catEntries.map(([cat, amt], i) => {
                                                const pct = Math.round((amt / expense) * 100);
                                                return (
                                                    <div key={cat}>
                                                        <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                                                            <span>{cat}</span>
                                                            <span>{pct}% — Rp {fmt(amt)}</span>
                                                        </div>
                                                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                                                transition={{ duration: 0.6, delay: i * 0.1 }}
                                                                className={`h-full rounded-full ${COLORS[i % COLORS.length]}`}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </>
                            )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Dashboard;

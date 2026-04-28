import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Wallet as WalletIcon, QrCode, X, Trash2, Plus } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

function getUserPayload() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return null;
        return JSON.parse(atob(token.split('.')[1]));
    } catch { return null; }
}

const Pocket = () => {
    const [accounts, setAccounts] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [selectedQR, setSelectedQR] = useState(null);

    const payload = getUserPayload();
    const userPhone = payload?.username || 'User';

    useEffect(() => { fetchPockets(); }, []);

    const fetchPockets = async () => {
        try {
            const { data } = await api.get('/api/pocket');
            setAccounts(data);
        } catch(e) {}
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.post('/api/pocket', { bankName, accountNumber });
            setAccounts([...accounts, data]);
            setShowAdd(false);
            setBankName('');
            setAccountNumber('');
            toast.success('Rekening berhasil ditambahkan!');
        } catch {
            toast.error('Gagal menambahkan');
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm('Yakin ingin menghapus rekening ini?')) return;
        try {
            await api.delete(`/api/pocket/${id}`);
            setAccounts(accounts.filter(a => a._id !== id));
            toast.success('Rekening dihapus!');
        } catch {
            toast.error('Gagal menghapus');
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-28 max-w-md mx-auto">

            {/* Header */}
            <div className="px-6 pt-10 pb-4 bg-white sticky top-0 z-30 shadow-sm border-b border-slate-100 mb-4">
                <h1 className="text-xl font-bold text-slate-800 text-center">My Pocket</h1>
            </div>

            <div className="px-5">

                {/* Kartu utama — data user nyata */}
                <div className="bg-gradient-to-br from-[#1880f0] to-[#0f5ac2] rounded-2xl p-5 text-white shadow-xl mb-6 relative overflow-hidden">
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full" />
                    <div className="absolute -right-2 -bottom-8 w-24 h-24 bg-white/10 rounded-full" />

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-5">
                            <div>
                                <p className="text-blue-200 text-[10px] font-semibold uppercase tracking-widest mb-0.5">AutoWallet</p>
                                <p className="text-white text-xs font-bold opacity-80">Rekening Digital</p>
                            </div>
                            <div className="w-8 h-5 bg-yellow-400 rounded-sm opacity-80" />
                        </div>

                        <div className="mb-5">
                            <p className="text-blue-200 text-[10px] mb-0.5">Rekening Tersimpan</p>
                            <h2 className="text-3xl font-extrabold tracking-tight">
                                {accounts.length} <span className="text-base font-semibold opacity-70">akun</span>
                            </h2>
                        </div>

                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-blue-200 text-[10px]">Nomor WhatsApp</p>
                                <p className="text-sm font-bold tracking-wide">+62 {userPhone}</p>
                            </div>
                            <WalletIcon size={20} className="opacity-40" />
                        </div>
                    </div>
                </div>

                {/* Judul daftar + tombol tambah */}
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold text-slate-800">Daftar Rekening QR</h3>
                    <button
                        onClick={() => setShowAdd(!showAdd)}
                        className="text-xs font-bold text-[#1880f0] flex items-center gap-1"
                    >
                        {showAdd ? 'Batal' : <><Plus size={13} /> Tambah</>}
                    </button>
                </div>

                {/* Form tambah */}
                {showAdd && (
                    <motion.form
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        onSubmit={handleAdd}
                        className="mb-4 bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-3"
                    >
                        <input
                            required
                            placeholder="Nama Bank (Cth: BCA, Mandiri)"
                            value={bankName}
                            onChange={e => setBankName(e.target.value)}
                            className="w-full text-sm p-3 rounded-lg border border-blue-200 outline-none focus:border-[#1880f0] bg-white"
                        />
                        <input
                            required
                            placeholder="Nomor Rekening"
                            type="number"
                            value={accountNumber}
                            onChange={e => setAccountNumber(e.target.value)}
                            className="w-full text-sm p-3 rounded-lg border border-blue-200 outline-none focus:border-[#1880f0] bg-white"
                        />
                        <button type="submit" className="w-full bg-[#1880f0] text-white font-bold py-3 rounded-lg text-sm">
                            Simpan Rekening
                        </button>
                    </motion.form>
                )}

                {/* Daftar rekening */}
                <div className="space-y-3 mb-8">
                    {accounts.length === 0 && !showAdd && (
                        <div className="text-center py-10">
                            <CreditCard size={36} className="text-slate-300 mx-auto mb-3" />
                            <p className="text-sm font-semibold text-slate-400">Belum ada rekening</p>
                            <p className="text-xs text-slate-400 mt-1">Tambahkan rekening untuk membuat QR Code instan</p>
                        </div>
                    )}
                    {accounts.map(acc => (
                        <div
                            key={acc._id}
                            onClick={() => setSelectedQR(acc)}
                            className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer relative"
                        >
                            <button
                                onClick={e => handleDelete(acc._id, e)}
                                className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={15} />
                            </button>

                            <div className="w-12 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-700 font-extrabold border border-blue-100 uppercase text-xs shrink-0">
                                {acc.bankName.slice(0, 4)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-800 truncate">{acc.bankName}</p>
                                <p className="text-xs text-slate-400 font-medium">•••• •••• {acc.accountNumber.slice(-4)}</p>
                            </div>

                            <div className="flex items-center gap-1 text-[#1880f0] shrink-0">
                                <QrCode size={17} />
                                <span className="text-xs font-bold">QR</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ——— QR Code Modal ——— */}
            <AnimatePresence>
                {selectedQR && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-5"
                        onClick={() => setSelectedQR(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.88, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.88, opacity: 0 }}
                            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                            className="bg-white w-full max-w-[320px] rounded-3xl shadow-2xl overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header biru */}
                            <div className="bg-[#1880f0] px-6 pt-6 pb-6 text-center relative">
                                <button
                                    onClick={() => setSelectedQR(null)}
                                    className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                                >
                                    <X size={15} className="text-white" />
                                </button>
                                <p className="text-blue-200 text-[10px] uppercase tracking-widest mb-1">QR Transfer</p>
                                <h2 className="text-white font-extrabold text-xl leading-tight">{selectedQR.bankName}</h2>
                                <p className="text-blue-200 text-sm mt-1 font-mono tracking-widest">{selectedQR.accountNumber}</p>
                            </div>

                            {/* QR Code */}
                            <div className="px-6 py-5 flex flex-col items-center">
                                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 shadow-inner">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=190x190&data=${encodeURIComponent(selectedQR.bankName + '|' + selectedQR.accountNumber)}`}
                                        alt="QR Code"
                                        width="190"
                                        height="190"
                                        className="rounded-lg block"
                                    />
                                </div>
                                <p className="text-xs text-slate-400 text-center mt-4 leading-relaxed px-2">
                                    Scan QR ini untuk transfer ke rek. <span className="font-bold text-slate-600">{selectedQR.bankName}</span> tanpa ketik manual.
                                </p>
                                <button
                                    onClick={() => setSelectedQR(null)}
                                    className="mt-4 w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors"
                                >
                                    Tutup
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Pocket;

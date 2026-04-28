import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Plus, UploadCloud, Trash2, X, DownloadCloud, FileText, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    
    // Form state
    const [type, setType] = useState('expense');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [proofImage, setProofImage] = useState(null);
    const [proofUrl, setProofUrl] = useState('');
    
    const [ocrLoading, setOcrLoading] = useState(false);
    const [filterCategory, setFilterCategory] = useState('all');

    const categories = {
        income: ['Gaji', 'Bonus', 'Investasi', 'Lainnya'],
        expense: ['Makanan', 'Transportasi', 'Belanja', 'Tagihan', 'Hiburan', 'Lainnya']
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const { data } = await api.get('/transactions');
            setTransactions(data);
        } catch (error) {
            toast.error('Gagal mengambil data dari server, menggunakan mode demo');
            setTransactions([
               { _id: '1', type: 'income', amount: 5000000, category: 'Gaji', description: 'Gaji bulan ini', date: new Date().toISOString() },
               { _id: '2', type: 'expense', amount: 150000, category: 'Makanan', description: 'Makan siang dengan tim', date: new Date().toISOString() },
               { _id: '3', type: 'expense', amount: 300000, category: 'Belanja', description: 'Beli buku', date: new Date(Date.now() - 86400000).toISOString() },
               { _id: '4', type: 'expense', amount: 50000, category: 'Transportasi', description: 'Ojek online', date: new Date(Date.now() - 172800000).toISOString() }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setProofImage(file);
        setOcrLoading(true);

        const formData = new FormData();
        formData.append('proof', file);

        try {
            const toastId = toast.loading('Memproses gambar (OCR)...');
            const { data } = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.dismiss(toastId);
            
            setProofUrl(data.imageUrl);
            if (data.detectedNominal) {
                setAmount(data.detectedNominal.toString());
                toast.success(`Ditemukan nominal: Rp ${data.detectedNominal}`);
            } else {
                toast.error('Nominal tidak terdeteksi. Silakan isi manual.');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Gagal proses upload');
        } finally {
            setOcrLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/transactions', {
                type,
                amount: Number(amount),
                category,
                description,
                date,
                proofImage: proofUrl
            });
            toast.success('Transaksi berhasil ditambahkan');
            setShowModal(false);
            resetForm();
            fetchTransactions();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Gagal menambahkan transaksi');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Yakin ingin menghapus transaksi ini?')) {
            try {
                await api.delete(`/transactions/${id}`);
                toast.success('Transaksi dihapus');
                fetchTransactions();
            } catch (error) {
                toast.error('Gagal menghapus');
            }
        }
    };

    const resetForm = () => {
        setType('expense');
        setAmount('');
        setCategory('');
        setDescription('');
        setDate(new Date().toISOString().split('T')[0]);
        setProofImage(null);
        setProofUrl('');
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text('Laporan Transaksi AutoWallet', 14, 15);
        doc.autoTable({
            startY: 20,
            head: [['Tanggal', 'Tipe', 'Kategori', 'Deskripsi', 'Nominal']],
            body: transactions.map(t => [
                format(new Date(t.date), 'dd/MM/yyyy'),
                t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
                t.category,
                t.description,
                `Rp ${t.amount}`
            ]),
        });
        doc.save('Laporan_Transaksi.pdf');
    };

    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(transactions.map(t => ({
            Tanggal: format(new Date(t.date), 'dd/MM/yyyy'),
            Tipe: t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
            Kategori: t.category,
            Deskripsi: t.description,
            Nominal: t.amount
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Transaksi");
        XLSX.writeFile(wb, "Laporan_Transaksi.xlsx");
    };

    const filteredTransactions = filterCategory === 'all' 
        ? transactions 
        : transactions.filter(t => t.type === filterCategory);

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Manajemen Transaksi</h1>
                    <p className="text-slate-500 dark:text-slate-400">Catat dan pantau pengeluaran Anda</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button onClick={exportToPDF} className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors" title="Export PDF">
                        <FileText size={20} />
                    </button>
                    <button onClick={exportToExcel} className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors" title="Export Excel">
                        <DownloadCloud size={20} />
                    </button>
                    <button 
                        onClick={() => setShowModal(true)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-4 py-2 rounded-xl shadow-lg shadow-emerald-500/30 transition-all font-medium"
                    >
                        <Plus size={20} />
                        <span>Tambah Transaksi</span>
                    </button>
                </div>
            </header>

            <div className="glass p-6 rounded-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Riwayat Transaksi</h3>
                    <select 
                        value={filterCategory} 
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-3 py-1.5 text-sm outline-none cursor-pointer text-slate-700 dark:text-slate-300"
                    >
                        <option value="all">Semua Tipe</option>
                        <option value="income">Pemasukan</option>
                        <option value="expense">Pengeluaran</option>
                    </select>
                </div>
                
                {loading ? (
                    <div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>
                ) : filteredTransactions.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 dark:text-slate-400">Tidak ada data transaksi</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700/50 text-slate-500 dark:text-slate-400 text-sm">
                                    <th className="py-3 px-4 font-semibold text-center whitespace-nowrap">Bukti</th>
                                    <th className="py-3 px-4 font-semibold">Tipe</th>
                                    <th className="py-3 px-4 font-semibold">Kategori</th>
                                    <th className="py-3 px-4 font-semibold whitespace-nowrap">Tanggal</th>
                                    <th className="py-3 px-4 font-semibold">Deskripsi</th>
                                    <th className="py-3 px-4 font-semibold text-right">Nominal</th>
                                    <th className="py-3 px-4 font-semibold text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransactions.map((tx) => (
                                    <tr key={tx._id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                        <td className="py-3 px-4 text-center">
                                            {tx.proofImage ? (
                                                <a href={`http://localhost:5000${tx.proofImage}`} target="_blank" rel="noreferrer" className="inline-block p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-800/50 transition-colors">
                                                    <ImageIcon size={18} />
                                                </a>
                                            ) : (
                                                <span className="text-slate-300 dark:text-slate-600">-</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${tx.type === 'income' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'}`}>
                                                {tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 capitalize text-slate-800 dark:text-slate-200">{tx.category}</td>
                                        <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">{format(new Date(tx.date), 'dd MMM yyyy', { locale: id })}</td>
                                        <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400 max-w-[150px] truncate">{tx.description || '-'}</td>
                                        <td className={`py-3 px-4 font-bold text-right whitespace-nowrap ${tx.type === 'income' ? 'text-emerald-500' : 'text-slate-800 dark:text-slate-200'}`}>
                                            {tx.type === 'income' ? '+' : '-'}Rp {tx.amount.toLocaleString('id-ID')}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <button onClick={() => handleDelete(tx._id)} className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Tambah */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800"
                        >
                            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
                                <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">Tambah Transaksi</h2>
                                <button onClick={() => {setShowModal(false); resetForm();}} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={24} /></button>
                            </div>
                            
                            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <button 
                                        type="button" 
                                        onClick={() => setType('expense')}
                                        className={`py-3 rounded-xl font-semibold border-2 transition-all ${type === 'expense' ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}
                                    >
                                        Pengeluaran
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setType('income')}
                                        className={`py-3 rounded-xl font-semibold border-2 transition-all ${type === 'income' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}
                                    >
                                        Pemasukan
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kategori</label>
                                        <select 
                                            value={category} 
                                            onChange={(e) => setCategory(e.target.value)} 
                                            required
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                        >
                                            <option value="" disabled>Pilih Kategori</option>
                                            {categories[type].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                        </select>
                                    </div>

                                    {type === 'expense' && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bukti Transfer (Opsional)</label>
                                            <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <input 
                                                    type="file" 
                                                    accept="image/png, image/jpeg" 
                                                    onChange={handleFileUpload} 
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                />
                                                <div className="flex flex-col items-center">
                                                    {ocrLoading ? (
                                                        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin my-2"></div>
                                                    ) : proofUrl ? (
                                                        <div className="text-emerald-500 flex flex-col items-center">
                                                            <ImageIcon size={24} className="mb-2" />
                                                            <span className="text-sm">Gambar berhasil diupload</span>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <UploadCloud size={28} className="text-slate-400 mb-2" />
                                                            <span className="text-sm text-slate-500 dark:text-slate-400">Upload bukti transaksi (JPG/PNG)<br/>Sistem akan mendeteksi nominal otomatis</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nominal (Rp)</label>
                                        <input 
                                            type="number" 
                                            value={amount} 
                                            onChange={(e) => setAmount(e.target.value)} 
                                            required 
                                            placeholder="Contoh: 50000"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tanggal</label>
                                        <input 
                                            type="date" 
                                            value={date} 
                                            onChange={(e) => setDate(e.target.value)} 
                                            required 
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Catatan</label>
                                        <input 
                                            type="text" 
                                            value={description} 
                                            onChange={(e) => setDescription(e.target.value)} 
                                            placeholder="Opsional"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <button 
                                        type="submit" 
                                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold py-3 rounded-xl shadow-lg shadow-emerald-500/30 transition-all"
                                    >
                                        Simpan Transaksi
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Transactions;

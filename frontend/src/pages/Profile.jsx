import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, User, ShieldCheck, Settings, Bell, HelpCircle, ChevronRight, X, Check, Eye, EyeOff } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

// ——— Ambil info user dari token ———
function getUserPayload() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return null;
        return JSON.parse(atob(token.split('.')[1]));
    } catch { return null; }
}

// ——— Modal dasar ———
const Modal = ({ open, onClose, title, children }) => (
    <AnimatePresence>
        {open && (
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25 }}
                    className="bg-white w-full max-w-md rounded-t-3xl flex flex-col"
                    style={{ maxHeight: '88vh' }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Drag handle */}
                    <div className="flex justify-center pt-3 pb-1 shrink-0">
                        <div className="w-10 h-1 bg-slate-200 rounded-full" />
                    </div>
                    <div className="overflow-y-auto px-6 pb-10 pt-3 flex-1">
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-lg font-bold text-slate-800">{title}</h2>
                            <button onClick={onClose} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200">
                                <X size={16} className="text-slate-600" />
                            </button>
                        </div>
                        {children}
                    </div>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);

// ——— Row menu yang bisa diklik ———
const MenuItem = ({ icon: Icon, iconBg, label, value, onClick }) => (
    <button onClick={onClick} className="w-full flex justify-between items-center p-3.5 hover:bg-slate-50 rounded-xl transition-colors group">
        <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
                <Icon size={18} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-700">{label}</span>
        </div>
        {value ? (
            <span className="text-xs font-bold text-slate-400">{value}</span>
        ) : (
            <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
        )}
    </button>
);

const Profile = () => {
    const payload = getUserPayload();
    const userPhone = payload?.username || 'User';
    const userId = payload?.id || 'anon';
    const isDemo = userPhone === 'Demo User' || userPhone === 'demo';

    // Avatar hewan dari DiceBear lorelei (animal-like characters)
    const avatarUrl = `https://api.dicebear.com/7.x/croodles/svg?seed=${userId}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

    // ——— State untuk modal ———
    const [modalInfo, setModalInfo] = useState(false);
    const [modalPin, setModalPin] = useState(false);
    const [modalSettings, setModalSettings] = useState(false);
    const [modalHelp, setModalHelp] = useState(false);

    // ——— State untuk Notifikasi (localStorage) ———
    const [notifEnabled, setNotifEnabled] = useState(() => localStorage.getItem('notif') !== 'off');
    const toggleNotif = () => {
        const next = !notifEnabled;
        setNotifEnabled(next);
        localStorage.setItem('notif', next ? 'on' : 'off');
        toast.success(next ? 'Notifikasi aktif' : 'Notifikasi dimatikan');
    };

    // ——— State untuk Ganti PIN ———
    const [oldPin, setOldPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [showPins, setShowPins] = useState(false);
    const [pinLoading, setPinLoading] = useState(false);

    const handleChangePin = async (e) => {
        e.preventDefault();
        if (newPin !== confirmPin) { toast.error('PIN baru tidak cocok.'); return; }
        if (newPin.length < 6) { toast.error('PIN baru minimal 6 angka.'); return; }
        setPinLoading(true);
        try {
            await api.post('/auth/change-pin', { oldPin, newPin });
            toast.success('PIN berhasil diubah!', { icon: '🔐' });
            setModalPin(false);
            setOldPin(''); setNewPin(''); setConfirmPin('');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Gagal mengubah PIN.');
        } finally {
            setPinLoading(false);
        }
    };

    // ——— Logout ———
    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    // ——— Pengaturan (tema warna — disimpan di localStorage) ———
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'on');
    const toggleDark = () => {
        const next = !darkMode;
        setDarkMode(next);
        localStorage.setItem('darkMode', next ? 'on' : 'off');
        toast(next ? '🌙 Mode gelap aktif (segera hadir)' : '☀️ Mode terang aktif');
    };

    // ——— FAQ untuk Pusat Bantuan ———
    const faqs = [
        { q: 'Bagaimana cara menambah transaksi?', a: 'Tekan ikon + di halaman Beranda atau Aktivitas, lalu isi form transaksi.' },
        { q: 'Bagaimana cara menambah rekening ke Pocket?', a: 'Masuk ke menu Pocket, tekan "+ Tambah", isi Nama Bank & Nomor Rekening.' },
        { q: 'Bagaimana jika lupa PIN?', a: 'Logout, lalu login ulang via OTP WhatsApp. Setelah masuk, ubah PIN di menu Keamanan & PIN.' },
        { q: 'Apakah data saya aman?', a: 'Ya. Data tersimpan lokal di server dengan enkripsi JWT. Nomor rekening hanya disimpan sebagai referensi QR Code.' },
        { q: 'Tidak menerima OTP?', a: 'Pastikan nomor WA Anda aktif dan ada sinyal. Tunggu 60 detik lalu minta kirim ulang.' },
    ];
    const [openFaq, setOpenFaq] = useState(null);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-28 max-w-md mx-auto bg-[#f7f8fa] min-h-screen">

            {/* ——— Header Biru + Avatar terpadu ——— */}
            <div className="bg-[#1880f0] pt-12 px-6 pb-0 rounded-b-[36px] relative flex flex-col items-center mb-4">
                <h1 className="text-white font-bold text-lg text-center mb-5">Profil Saya</h1>

                {/* Avatar melayang di antara header dan konten */}
                <div className="flex flex-col items-center pb-0">
                    {/* Lingkaran putih di dalam biru */}
                    <div className="w-24 h-24 bg-white rounded-full p-1.5 shadow-xl border-[3px] border-white overflow-hidden mb-3">
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full rounded-full bg-blue-50 object-cover" />
                    </div>
                    <h2 className="text-white font-extrabold text-base">+62 {userPhone}</h2>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full mt-1.5 mb-4 ${isDemo ? 'text-orange-700 bg-orange-200' : 'text-blue-700 bg-blue-100'}`}>
                        {isDemo ? '🚀 Mode Demo' : '✅ Akun Terverifikasi'}
                    </span>
                </div>

                {/* Gelombang bawah */}
                <div className="w-full h-6 bg-[#f7f8fa] rounded-t-3xl" />
            </div>

            <div className="px-4 space-y-3">

                {/* ——— Kartu Akun ——— */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50">
                    <MenuItem icon={User} iconBg="bg-blue-500" label="Informasi Pribadi" onClick={() => setModalInfo(true)} />
                    <MenuItem icon={ShieldCheck} iconBg="bg-indigo-500" label="Keamanan & PIN" onClick={() => !isDemo ? setModalPin(true) : toast.error('Tidak tersedia di mode demo')} />
                </div>

                {/* ——— Kartu Preferensi ——— */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50">
                    <MenuItem icon={Settings} iconBg="bg-slate-500" label="Pengaturan Aplikasi" onClick={() => setModalSettings(true)} />

                    {/* Notifikasi dengan toggle switch */}
                    <div className="flex justify-between items-center p-3.5 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
                                <Bell size={18} className="text-white" />
                            </div>
                            <span className="text-sm font-semibold text-slate-700">Notifikasi</span>
                        </div>
                        <button
                            onClick={toggleNotif}
                            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${notifEnabled ? 'bg-[#1880f0]' : 'bg-slate-200'}`}
                        >
                            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${notifEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                    </div>

                    <MenuItem icon={HelpCircle} iconBg="bg-green-500" label="Pusat Bantuan" onClick={() => setModalHelp(true)} />
                </div>

                {/* ——— Versi App ——— */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-500">Versi Aplikasi</span>
                    <span className="text-sm font-bold text-[#1880f0]">AutoWallet v1.0.0</span>
                </div>

                {/* ——— Tombol Logout ——— */}
                <button
                    onClick={handleLogout}
                    className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors border border-red-100"
                >
                    <LogOut size={16} />
                    KELUAR (LOGOUT)
                </button>
            </div>

            {/* ========== MODAL: Informasi Pribadi ========== */}
            <Modal open={modalInfo} onClose={() => setModalInfo(false)} title="Informasi Pribadi">
                <div className="space-y-4">
                    <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-4">
                        <img src={avatarUrl} alt="Avatar" className="w-14 h-14 rounded-full bg-blue-50" />
                        <div>
                            <p className="text-xs text-slate-400 font-medium">Nomor WhatsApp Terdaftar</p>
                            <p className="text-base font-extrabold text-slate-800">+62 {userPhone}</p>
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-bold">Terverifikasi ✅</span>
                        </div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                        <p className="text-xs text-slate-400 font-medium mb-1">ID Akun</p>
                        <p className="text-xs font-mono text-slate-600 break-all">{userId}</p>
                    </div>
                    <p className="text-xs text-slate-400 text-center">Untuk mengubah nomor WA, hubungi dukungan kami.</p>
                </div>
            </Modal>

            {/* ========== MODAL: Keamanan & PIN ========== */}
            <Modal open={modalPin} onClose={() => setModalPin(false)} title="Ganti PIN">
                <form onSubmit={handleChangePin} className="space-y-4">
                    {[
                        { label: 'PIN Lama', val: oldPin, setter: setOldPin },
                        { label: 'PIN Baru (min. 6 angka)', val: newPin, setter: setNewPin },
                        { label: 'Konfirmasi PIN Baru', val: confirmPin, setter: setConfirmPin },
                    ].map(({ label, val, setter }) => (
                        <div key={label}>
                            <label className="text-xs font-bold text-slate-500 mb-1 block uppercase">{label}</label>
                            <div className="relative">
                                <input
                                    type={showPins ? 'text' : 'password'}
                                    value={val}
                                    onChange={e => setter(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    maxLength={6}
                                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 font-bold tracking-widest text-center outline-none focus:border-[#1880f0]"
                                    placeholder="••••••"
                                />
                            </div>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => setShowPins(!showPins)}
                        className="flex items-center gap-1.5 text-xs text-slate-400 font-medium"
                    >
                        {showPins ? <EyeOff size={14}/> : <Eye size={14}/>}
                        {showPins ? 'Sembunyikan PIN' : 'Tampilkan PIN'}
                    </button>
                    <button
                        type="submit"
                        disabled={pinLoading}
                        className="w-full bg-[#1880f0] text-white font-extrabold py-4 rounded-xl disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        {pinLoading ? 'Menyimpan...' : <><Check size={16}/> SIMPAN PIN BARU</>}
                    </button>
                </form>
            </Modal>

            {/* ========== MODAL: Pengaturan Aplikasi ========== */}
            <Modal open={modalSettings} onClose={() => setModalSettings(false)} title="Pengaturan Aplikasi">
                <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                        <div>
                            <p className="text-sm font-semibold text-slate-700">Mode Gelap</p>
                            <p className="text-xs text-slate-400">Tampilan layar gelap (segera hadir)</p>
                        </div>
                        <button
                            onClick={toggleDark}
                            className={`relative w-11 h-6 rounded-full transition-colors ${darkMode ? 'bg-[#1880f0]' : 'bg-slate-200'}`}
                        >
                            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${darkMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                        <div>
                            <p className="text-sm font-semibold text-slate-700">Bahasa</p>
                            <p className="text-xs text-slate-400">Indonesia (Bawaan)</p>
                        </div>
                        <span className="text-sm font-bold text-slate-400">🇮🇩</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                        <div>
                            <p className="text-sm font-semibold text-slate-700">Format Mata Uang</p>
                            <p className="text-xs text-slate-400">Rupiah (IDR)</p>
                        </div>
                        <span className="text-sm font-bold text-[#1880f0]">Rp</span>
                    </div>
                </div>
            </Modal>

            {/* ========== MODAL: Pusat Bantuan ========== */}
            <Modal open={modalHelp} onClose={() => setModalHelp(false)} title="Pusat Bantuan">
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {faqs.map((faq, i) => (
                        <div key={i} className="bg-slate-50 rounded-xl overflow-hidden">
                            <button
                                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                className="w-full flex justify-between items-center p-4 text-left"
                            >
                                <span className="text-sm font-semibold text-slate-700 pr-4">{faq.q}</span>
                                <ChevronRight size={16} className={`text-slate-400 shrink-0 transition-transform ${openFaq === i ? 'rotate-90' : ''}`} />
                            </button>
                            {openFaq === i && (
                                <div className="px-4 pb-4">
                                    <p className="text-sm text-slate-500 leading-relaxed">{faq.a}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-xs text-blue-700 font-semibold text-center mb-2">
                        📞 Butuh bantuan lebih lanjut?
                    </p>
                    <a
                        href="https://wa.me/6285648601964?text=Halo%20AutoWallet%2C%20saya%20butuh%20bantuan"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl text-sm transition-colors active:scale-95"
                    >
                        <span>💬</span> Chat WhatsApp 085648601964
                    </a>
                </div>
            </Modal>

        </motion.div>
    );
};

export default Profile;

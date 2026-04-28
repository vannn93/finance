import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    UserPlus, 
    Smartphone, 
    ChevronRight, 
    ArrowLeft, 
    ShieldCheck, 
    Zap, 
    Wallet,
    Loader2,
    Lock,
    User
} from 'lucide-react';
import api from '../utils/api';

const Register = () => {
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [pin, setPin] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [devMode, setDevMode] = useState(false);
    const navigate = useNavigate();

    // Langkah 1: Request OTP ke WA
    const handleRequestOTP = async (e) => {
        e.preventDefault();
        if (!name.trim()) { toast.error('Nama tidak boleh kosong.'); return; }
        if (phone.length < 8) { toast.error('Nomor HP tidak valid.'); return; }
        if (pin.length < 6) { toast.error('PIN harus 6 angka.'); return; }

        setLoading(true);
        try {
            const { data } = await api.post('/auth/request-register-otp', { phone, password: pin });

            // DEV FALLBACK
            if (data.devOTP) {
                setDevMode(true);
                setOtp(data.devOTP);
                toast('🔧 Dev Mode: OTP auto-diisi.', {
                    duration: 4000,
                    style: { background: '#f59e0b', color: '#fff', fontWeight: 'bold' }
                });
            } else {
                setDevMode(false);
                toast.success('Kode OTP dikirim ke WhatsApp!', { icon: '📲' });
            }
            setStep(2);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Gagal mengirim OTP.');
        } finally {
            setLoading(false);
        }
    };

    // Langkah 2: Verifikasi OTP
    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        if (otp.length !== 4) { toast.error('Masukkan 4 digit kode OTP.'); return; }

        setLoading(true);
        try {
            const { data } = await api.post('/auth/verify-register-otp', { phone, otp });
            localStorage.setItem('token', data.token);
            toast.success('Pendaftaran Berhasil!', { icon: '🎉' });
            window.location.href = '/';
        } catch (error) {
            toast.error(error.response?.data?.message || 'OTP salah atau kadaluarsa.');
        } finally {
            setLoading(false);
        }
    };

    const variants = {
        enter: (direction) => ({
            x: direction > 0 ? 50 : -50,
            opacity: 0
        }),
        center: {
            x: 0,
            opacity: 1
        },
        exit: (direction) => ({
            x: direction < 0 ? 50 : -50,
            opacity: 0
        })
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[100px] opacity-50"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[100px] opacity-50"></div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                {/* Logo Section */}
                <div className="flex flex-col items-center mb-8">
                    <motion.div 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-blue-200"
                    >
                        <Wallet className="w-8 h-8 text-white" />
                    </motion.div>
                </div>

                {/* Card Container */}
                <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[32px] shadow-2xl shadow-slate-200/50 p-8">
                    <AnimatePresence mode="wait" custom={step}>
                        {step === 1 ? (
                            <motion.div
                                key="step1"
                                custom={1}
                                variants={variants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            >
                                <div className="mb-8">
                                    <h2 className="text-xl font-bold text-slate-800 mb-2">Buat Akun Baru ✨</h2>
                                    <p className="text-sm text-slate-500 leading-relaxed">
                                        Mulai perjalanan finansial Anda yang lebih teratur hari ini.
                                    </p>
                                </div>

                                <form onSubmit={handleRequestOTP} className="space-y-5">
                                    <div className="space-y-4">
                                        {/* Nama Input */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Nama Lengkap</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-800"
                                                    placeholder="Masukkan nama Anda"
                                                />
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                            </div>
                                        </div>

                                        {/* Phone Input */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Nomor WhatsApp</label>
                                            <div className="group relative">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 border-r border-slate-200 pr-3">
                                                    <span className="text-slate-400 font-bold text-sm">+62</span>
                                                </div>
                                                <input
                                                    type="tel"
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                                    className="w-full pl-16 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-800"
                                                    placeholder="81234567890"
                                                />
                                                <Smartphone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                            </div>
                                        </div>

                                        {/* PIN Input */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Buat PIN (6 Angka)</label>
                                            <div className="relative">
                                                <input
                                                    type="password"
                                                    value={pin}
                                                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-800 tracking-[0.5em]"
                                                    placeholder="••••••"
                                                />
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full group relative bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 disabled:translate-y-0 mt-2"
                                    >
                                        <span className="flex items-center justify-center gap-2">
                                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Daftar Sekarang'}
                                            {!loading && <UserPlus className="w-5 h-5" />}
                                        </span>
                                    </button>
                                </form>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="step2"
                                custom={-1}
                                variants={variants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            >
                                <button 
                                    onClick={() => setStep(1)}
                                    className="mb-6 flex items-center gap-2 text-slate-400 hover:text-slate-600 font-bold text-sm transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" /> Kembali
                                </button>

                                <div className="mb-8">
                                    <h2 className="text-xl font-bold text-slate-800 mb-2">Verifikasi OTP 🔐</h2>
                                    <p className="text-sm text-slate-500 leading-relaxed">
                                        Masukkan kode unik yang kami kirimkan ke <span className="text-blue-600 font-bold">+62 {phone}</span>
                                    </p>
                                </div>

                                <form onSubmit={handleVerifyOTP} className="space-y-6">
                                    <div className="flex justify-center">
                                        <input
                                            type="tel"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                            className="w-full max-w-[240px] px-4 py-5 text-center text-4xl font-black tracking-[0.5em] bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 focus:bg-white text-blue-600 shadow-inner"
                                            placeholder="0000"
                                            autoFocus
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full group bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 hover:shadow-xl transition-all disabled:opacity-70 mt-2"
                                    >
                                        <span className="flex items-center justify-center gap-2">
                                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verifikasi & Selesai'}
                                            {!loading && <ShieldCheck className="w-5 h-5" />}
                                        </span>
                                    </button>

                                    <div className="text-center">
                                        <button 
                                            type="button" 
                                            onClick={handleRequestOTP} 
                                            className="text-sm text-blue-600 font-bold hover:underline"
                                        >
                                            Kirim Ulang Kode
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Link */}
                <div className="mt-8 text-center">
                    <p className="text-sm text-slate-600 font-medium tracking-tight">
                        Sudah punya akun?{' '}
                        <button onClick={() => navigate('/login')} className="text-blue-600 font-bold hover:underline">
                            Masuk di sini
                        </button>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;

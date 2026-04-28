import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    MessageSquare, 
    Smartphone, 
    ChevronRight, 
    ArrowLeft, 
    ShieldCheck, 
    Zap, 
    Wallet,
    Loader2
} from 'lucide-react';
import api from '../utils/api';

const Login = () => {
    const [step, setStep] = useState(1);
    const [phone, setPhone] = useState('');
    const [pin, setPin] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [devMode, setDevMode] = useState(false);
    const navigate = useNavigate();

    // Langkah 1: Minta OTP ke WA (Setelah cek PIN)
    const handleRequestOTP = async (e) => {
        e?.preventDefault();
        if (phone.length < 8) {
            toast.error('Nomor HP tidak valid.');
            return;
        }
        if (pin.length < 6) {
            toast.error('Masukkan 6 digit PIN Anda.');
            return;
        }
        setLoading(true);
        try {
            const { data } = await api.post('/auth/request-otp', { phone, password: pin });

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
        if (otp.length !== 4) {
            toast.error('Masukkan 4 digit kode OTP.');
            return;
        }
        setLoading(true);
        try {
            const { data } = await api.post('/auth/verify-otp', { phone, otp });
            localStorage.setItem('token', data.token);
            toast.success('Berhasil masuk!', { icon: '✅' });
            window.location.href = '/';
        } catch (error) {
            toast.error(error.response?.data?.message || 'Kode OTP salah.');
        } finally {
            setLoading(false);
        }
    };

    const handleDemo = async () => {
        setLoading(true);
        try {
            const { data } = await api.post('/auth/demo');
            localStorage.setItem('token', data.token);
            toast.success('Masuk Mode Demo!', { icon: '🚀' });
            window.location.href = '/';
        } catch (e) {
            toast.error('Server tidak tersedia.');
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
                        className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center mb-4 shadow-xl shadow-blue-200"
                    >
                        <Wallet className="w-10 h-10 text-white" />
                    </motion.div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">AutoWallet</h1>
                    <p className="text-slate-500 font-medium">Finance assistant in your pocket</p>
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
                                    <h2 className="text-xl font-bold text-slate-800 mb-2">Selamat Datang 👋</h2>
                                    <p className="text-sm text-slate-500 leading-relaxed">
                                        Masuk dengan nomor WhatsApp Anda untuk mulai mengelola keuangan.
                                    </p>
                                </div>

                                <form onSubmit={handleRequestOTP} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
                                            Nomor WhatsApp
                                        </label>
                                        <div className="group relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 border-r border-slate-200 pr-3">
                                                <span className="text-slate-400 font-bold text-sm">+62</span>
                                            </div>
                                            <input
                                                type="tel"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                                className="w-full pl-16 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all font-bold text-slate-800 tracking-wide text-lg"
                                                placeholder="81234567890"
                                                autoFocus
                                            />
                                            <Smartphone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
                                            PIN Keamanan
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pr-3 border-r border-slate-200">
                                                <ShieldCheck className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                            </div>
                                            <input
                                                type="password"
                                                maxLength={6}
                                                value={pin}
                                                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                                className="w-full pl-16 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all font-bold text-slate-800 tracking-[0.3em] text-lg"
                                                placeholder="••••••"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full group relative bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 disabled:translate-y-0"
                                    >
                                        <span className="flex items-center justify-center gap-2">
                                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Lanjutkan'}
                                            {!loading && <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                                        </span>
                                    </button>

                                    <div className="relative flex items-center gap-4 py-2">
                                        <div className="flex-1 h-px bg-slate-100"></div>
                                        <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Atau</span>
                                        <div className="flex-1 h-px bg-slate-100"></div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleDemo}
                                        disabled={loading}
                                        className="w-full flex items-center justify-center gap-3 border-2 border-slate-100 text-slate-600 font-bold py-4 rounded-2xl hover:bg-slate-50 hover:border-slate-200 transition-all disabled:opacity-50"
                                    >
                                        <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                                        Mode Demo
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
                                    onClick={() => { setStep(1); setOtp(''); }}
                                    className="mb-6 flex items-center gap-2 text-slate-400 hover:text-slate-600 font-bold text-sm transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" /> Kemasukan Nomor
                                </button>

                                <div className="mb-8">
                                    <h2 className="text-xl font-bold text-slate-800 mb-2">Verifikasi OTP 🔐</h2>
                                    <p className="text-sm text-slate-500 leading-relaxed">
                                        Masukkan 4 digit kode yang kami kirimkan ke <span className="text-blue-600 font-bold">+62 {phone}</span>
                                    </p>
                                </div>

                                <form onSubmit={handleVerifyOTP} className="space-y-6">
                                    <div className="flex justify-center">
                                        <input
                                            type="tel"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                            className="w-full max-w-[240px] px-4 py-5 text-center text-4xl font-black tracking-[0.5em] bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all text-blue-600 shadow-inner"
                                            placeholder="0000"
                                            autoFocus
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full group bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 disabled:translate-y-0"
                                    >
                                        <span className="flex items-center justify-center gap-2">
                                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verifikasi & Masuk'}
                                            {!loading && <ShieldCheck className="w-5 h-5" />}
                                        </span>
                                    </button>

                                    <div className="text-center">
                                        <p className="text-sm text-slate-400 font-medium">
                                            Tidak menerima kode?{' '}
                                            <button 
                                                type="button" 
                                                onClick={handleRequestOTP} 
                                                className="text-blue-600 font-bold hover:underline"
                                            >
                                                Kirim Ulang
                                            </button>
                                        </p>
                                    </div>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Links */}
                <div className="mt-8 flex flex-col items-center gap-4">
                    {step === 1 && (
                        <p className="text-sm text-slate-600 font-medium">
                            Belum punya akun?{' '}
                            <button onClick={() => navigate('/register')} className="text-blue-600 font-bold hover:underline">
                                Daftar Sekarang
                            </button>
                        </p>
                    ) || (
                        <div className="flex items-center gap-2 text-slate-400 font-medium text-xs bg-slate-100 px-4 py-2 rounded-full">
                            <MessageSquare className="w-3 h-3" />
                            Cek WhatsApp Anda
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-slate-400">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Enkripsi End-to-End</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;

import React from 'react';
import { motion } from 'framer-motion';

const BalanceCard = ({ balance, income, expense }) => {
    const formatCurrency = (num) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
    };

    return (
        <motion.div 
            whileTap={{ scale: 0.98 }}
            className="w-full bg-gradient-to-br from-indigo-600 to-green-500 rounded-2xl p-6 text-white shadow-lg overflow-hidden relative shadow-indigo-500/20 isolate"
        >
            {/* Background Decorations */}
            <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -z-10 translate-x-10 -translate-y-8"></div>
            <div className="absolute left-0 bottom-0 w-24 h-24 bg-green-900/30 rounded-full blur-xl -z-10 -translate-x-6 translate-y-6"></div>

            <p className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-2">Total Saldo</p>
            <h2 className="text-3xl font-bold tracking-tight mb-6">{formatCurrency(balance)}</h2>

            <div className="flex gap-4">
                <div className="flex-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3">
                    <p className="text-[10px] text-white/70 font-semibold uppercase mb-1 flex items-center gap-1">
                        Pemasukan ↘
                    </p>
                    <p className="text-sm font-bold truncate">{formatCurrency(income)}</p>
                </div>
                <div className="flex-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3">
                    <p className="text-[10px] text-white/70 font-semibold uppercase mb-1 flex items-center gap-1">
                        Pengeluaran ↗
                    </p>
                    <p className="text-sm font-bold truncate">{formatCurrency(expense)}</p>
                </div>
            </div>
        </motion.div>
    );
};

export default BalanceCard;

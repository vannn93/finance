import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Trash2 } from 'lucide-react';

const CATEGORY_MAP = {
    // Expense
    'makan': { icon: '🍽️', bg: 'bg-orange-50', color: 'text-orange-500' },
    'makanan': { icon: '🍽️', bg: 'bg-orange-50', color: 'text-orange-500' },
    'transport': { icon: '🚗', bg: 'bg-blue-50', color: 'text-blue-500' },
    'belanja': { icon: '🛍️', bg: 'bg-pink-50', color: 'text-pink-500' },
    'tagihan': { icon: '📄', bg: 'bg-red-50', color: 'text-red-500' },
    'hiburan': { icon: '🎮', bg: 'bg-purple-50', color: 'text-purple-500' },
    'kesehatan': { icon: '💊', bg: 'bg-green-50', color: 'text-green-600' },
    'pendidikan': { icon: '📚', bg: 'bg-indigo-50', color: 'text-indigo-500' },
    'listrik': { icon: '⚡', bg: 'bg-yellow-50', color: 'text-yellow-600' },
    'pulsa': { icon: '📱', bg: 'bg-cyan-50', color: 'text-cyan-500' },
    'data': { icon: '📡', bg: 'bg-cyan-50', color: 'text-cyan-500' },
    // Income
    'gaji': { icon: '💼', bg: 'bg-green-50', color: 'text-green-600' },
    'freelance': { icon: '💻', bg: 'bg-teal-50', color: 'text-teal-600' },
    'investasi': { icon: '📈', bg: 'bg-emerald-50', color: 'text-emerald-600' },
    'hadiah': { icon: '🎁', bg: 'bg-rose-50', color: 'text-rose-500' },
    'penjualan': { icon: '🏷️', bg: 'bg-lime-50', color: 'text-lime-600' },
    'top up': { icon: '💳', bg: 'bg-blue-50', color: 'text-blue-600' },
};

function getCategoryStyle(cat, type) {
    const key = cat?.toLowerCase() || '';
    for (const [k, v] of Object.entries(CATEGORY_MAP)) {
        if (key.includes(k)) return v;
    }
    return type === 'income'
        ? { icon: '💰', bg: 'bg-green-50', color: 'text-green-600' }
        : { icon: '💸', bg: 'bg-slate-50', color: 'text-slate-500' };
}

const fmt = (n) => new Intl.NumberFormat('id-ID').format(n);

const TransactionItem = ({ transaction, onClick, onDelete }) => {
    const isIncome = transaction.type === 'income';
    const style = getCategoryStyle(transaction.category, transaction.type);

    let dateStr = '';
    try {
        dateStr = format(new Date(transaction.date), 'dd MMM • HH:mm', { locale: id });
    } catch { dateStr = '—'; }

    return (
        <div
            onClick={onClick}
            className="flex items-center justify-between py-3 px-1 cursor-pointer hover:bg-slate-50 rounded-xl transition-colors group relative"
        >
            {/* Kiri: icon + teks */}
            <div className="flex items-center gap-3 min-w-0">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 ${style.bg}`}>
                    {style.icon}
                </div>
                <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-[13px] leading-tight truncate">
                        {transaction.description || transaction.category}
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                        <span className={`font-semibold ${style.color} mr-1.5`}>{transaction.category}</span>
                        {dateStr}
                    </p>
                </div>
            </div>

            {/* Kanan: nominal + delete button */}
            <div className="flex items-center gap-3">
                <div className="shrink-0 text-right">
                    <span className={`font-bold text-sm ${isIncome ? 'text-green-500' : 'text-rose-500'}`}>
                        {isIncome ? '+' : '-'}Rp {fmt(transaction.amount)}
                    </span>
                    <p className={`text-[10px] font-medium mt-0.5 ${isIncome ? 'text-green-400' : 'text-rose-300'}`}>
                        {isIncome ? 'Masuk' : 'Keluar'}
                    </p>
                </div>

                {onDelete && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(transaction._id);
                        }}
                        className="p-2 text-slate-300 hover:text-red-500 transition-all active:scale-90"
                    >
                        <Trash2 size={18} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default TransactionItem;

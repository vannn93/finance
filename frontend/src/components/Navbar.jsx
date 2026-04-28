import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, LayoutDashboard, Receipt, Moon, Sun } from 'lucide-react';

const Navbar = () => {
    const { logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="glass sticky top-0 z-50 p-4 mb-6 transition-colors duration-200">
            <div className="container mx-auto flex justify-between items-center max-w-4xl">
                <Link to="/" className="text-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                    AutoWallet
                </Link>
                <div className="flex items-center space-x-4 md:space-x-6">
                    <Link to="/" className="text-slate-600 dark:text-slate-300 hover:text-emerald-500 flex items-center gap-1 transition-colors">
                        <LayoutDashboard size={18} />
                        <span className="hidden md:inline">Dashboard</span>
                    </Link>
                    <Link to="/transactions" className="text-slate-600 dark:text-slate-300 hover:text-emerald-500 flex items-center gap-1 transition-colors">
                        <Receipt size={18} />
                        <span className="hidden md:inline">Transaksi</span>
                    </Link>
                    <button 
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        {theme === 'dark' ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-slate-600" />}
                    </button>
                    <button 
                        onClick={handleLogout} 
                        className="text-red-500 hover:text-red-600 flex items-center gap-1 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        <LogOut size={18} />
                        <span className="hidden md:inline">Keluar</span>
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, List, Plus, Scan, UserCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const BottomNavigation = ({ onAddClick }) => {
    const location = useLocation();

    const navItems = [
        { path: '/', icon: Home, label: 'Home' },
        { path: '/activity', icon: List, label: 'Activity' },
    ];

    const navItemsRight = [
        { path: '/scan', icon: Scan, label: 'Scan' },
        { path: '/profile', icon: UserCircle, label: 'Profile' },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.04)]">
            <div className="flex justify-around items-center px-1 py-1.5 relative">
                
                {/* Left Items */}
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    return (
                        <NavLink key={item.path} to={item.path} className="flex flex-col items-center justify-center p-2 pt-3 w-[20%]">
                            <motion.div whileTap={{ scale: 0.85 }}>
                                <Icon size={24} className={`mb-1 transition-colors ${isActive ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-500'}`} />
                            </motion.div>
                            <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                {item.label}
                            </span>
                        </NavLink>
                    );
                })}

                {/* Center FAB */}
                <div className="relative -top-7 flex justify-center w-[20%]">
                    <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onAddClick}
                        className="absolute w-14 h-14 bg-gradient-to-br from-blue-500 to-emerald-400 rounded-full flex items-center justify-center text-white shadow-[0_8px_20px_-6px_rgba(16,185,129,0.5)] border-4 border-[#f7f8fa] dark:border-slate-900"
                    >
                        <Plus size={28} strokeWidth={2.5} />
                    </motion.button>
                </div>

                {/* Right Items */}
                {navItemsRight.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    return (
                        <NavLink key={item.path} to={item.path} className="flex flex-col items-center justify-center p-2 pt-3 w-[20%]">
                            <motion.div whileTap={{ scale: 0.85 }}>
                                <Icon size={24} className={`mb-1 transition-colors ${isActive ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-500'}`} />
                            </motion.div>
                            <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                {item.label}
                            </span>
                        </NavLink>
                    );
                })}
            </div>
        </div>
    );
};

export default BottomNavigation;

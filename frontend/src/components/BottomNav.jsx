import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, FileText, Smartphone, User, ScanLine } from 'lucide-react';
import { motion } from 'framer-motion';

const BottomNav = ({ onAddClick }) => {
    const location = useLocation();

    const menuItems = [
        { path: '/', icon: Home, label: 'Home' },
        { path: '/activity', icon: FileText, label: 'History' },
    ];

    const rightItems = [
        { path: '/pocket', icon: Smartphone, label: 'Pocket' },
        { path: '/profile', icon: User, label: 'Me' },
    ];

    const renderLink = (item) => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;
        
        return (
            <NavLink key={item.path} to={item.path} className="flex flex-col items-center justify-center w-16 group">
                <Icon size={24} className={`mb-1 transition-colors duration-300 ${isActive ? 'text-[#1880f0]' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span className={`text-[10px] font-bold transition-colors duration-300 ${isActive ? 'text-[#1880f0]' : 'text-slate-400'}`}>
                    {item.label}
                </span>
            </NavLink>
        );
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 pb-safe pt-2 px-1 flex justify-around items-center h-[72px]">
            {menuItems.map(renderLink)}
            
            <div className="relative -top-5 flex flex-col items-center justify-center w-16">
                <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onAddClick}
                    className="w-[52px] h-[52px] bg-[#1880f0] rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-500/30 border-4 border-white z-10"
                >
                    <ScanLine size={24} strokeWidth={2.5} />
                </motion.button>
                <span className="text-[10px] font-bold text-[#1880f0] mt-1 relative z-0">
                    Pay
                </span>
            </div>

            {rightItems.map(renderLink)}
        </div>
    );
};

export default BottomNav;

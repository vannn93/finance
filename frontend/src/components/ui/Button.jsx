import React from 'react';
import { motion } from 'framer-motion';

const Button = ({ 
    children, 
    onClick, 
    variant = 'primary', 
    size = 'md',
    fullWidth = false,
    disabled = false,
    className = '',
    type = 'button'
}) => {
    const baseStyle = "font-semibold rounded-xl flex items-center justify-center transition-opacity disabled:opacity-50 disabled:cursor-not-allowed";
    
    const sizes = {
        sm: "py-2 px-4 text-xs",
        md: "py-3 px-6 text-sm",
        lg: "py-4 px-8 text-base"
    };

    const variants = {
        primary: "bg-[#1880f0] text-white shadow-lg shadow-blue-500/30 hover:opacity-90",
        secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
        outline: "border-2 border-slate-200 text-slate-700 hover:border-slate-300 bg-transparent",
        danger: "bg-rose-50 text-rose-600 hover:bg-rose-100"
    };

    return (
        <motion.button
            type={type}
            whileTap={disabled ? {} : { scale: 0.98 }}
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyle} ${sizes[size]} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
        >
            {children}
        </motion.button>
    );
};

export default Button;

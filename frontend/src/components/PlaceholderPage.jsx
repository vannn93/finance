import React from 'react';
import { motion } from 'framer-motion';

const PlaceholderPage = ({ title, icon, description }) => {
    return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6">
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 shadow-sm border border-blue-100">
                <span className="text-4xl">{icon}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">{title}</h1>
            <p className="text-sm text-slate-500 max-w-[250px] mx-auto mb-8 font-medium">
                {description}
            </p>
            
            <button className="bg-[#f7f8fa] text-blue-600 font-bold px-6 py-3 rounded-full border border-slate-200">
                Lanjut Ekplorasi Fitur Lain
            </button>
        </motion.div>
    );
};

export default PlaceholderPage;

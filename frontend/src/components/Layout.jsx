import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from './BottomNav';
import AddTransactionModal from './AddTransactionModal';

const Layout = ({ children }) => {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!localStorage.getItem('token')) {
            navigate('/login');
        }
    }, [navigate]);

    return (
        <div className="min-h-screen bg-white pb-24 font-sans text-slate-800 shadow-sm relative overflow-x-hidden">
            <main className="container mx-auto px-4 max-w-md">
                {children}
            </main>
            <BottomNav onAddClick={() => setIsAddOpen(true)} />
            <AddTransactionModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
        </div>
    );
};

export default Layout;

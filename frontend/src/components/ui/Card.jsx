import React from 'react';

const Card = ({ children, className = '', noPadding = false, onClick }) => {
    return (
        <div 
            onClick={onClick}
            className={`bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-slate-100 ${noPadding ? '' : 'p-5'} ${onClick ? 'cursor-pointer hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-shadow' : ''} ${className}`}
        >
            {children}
        </div>
    );
};

export default Card;

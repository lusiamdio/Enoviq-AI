import React from 'react';
import { motion } from 'motion/react';

export default function WinePourLoader() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-4">
      <div className="relative w-12 h-16">
        {/* Glass Outline */}
        <svg viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full z-10">
          <path d="M4 2C4 2 4 12 4 14C4 18.4183 7.58172 22 12 22C16.4183 22 20 18.4183 20 14C20 12 20 2 20 2" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 22V30" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M8 30H16" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        
        {/* Wine Fill using Clip Path */}
        <svg viewBox="0 0 24 32" className="absolute inset-0 w-full h-full z-0">
          <clipPath id="glass-bowl">
            <path d="M4 2C4 2 4 12 4 14C4 18.4183 7.58172 22 12 22C16.4183 22 20 18.4183 20 14C20 12 20 2 20 2Z" />
          </clipPath>
          <g clipPath="url(#glass-bowl)">
            <motion.rect
              x="0"
              y="22"
              width="24"
              height="22"
              fill="#722F37"
              initial={{ y: 22 }}
              animate={{ y: [22, 10, 10, 22] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          </g>
        </svg>
      </div>
      <p className="text-xs text-gold-500 font-serif animate-pulse">Pouring thoughts...</p>
    </div>
  );
}

import React from 'react';

export const Logo: React.FC<{ className?: string; collapsed?: boolean }> = ({ className, collapsed }) => {
  return (
    <div className={`flex items-center gap-3 ${className} ${collapsed ? 'mx-auto' : ''}`}>
      <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
        {/* Gear Background */}
        <svg viewBox="0 0 100 100" className="absolute w-full h-full text-brand-green animate-spin-slow opacity-80">
          <path
            fill="currentColor"
            d="M95,43.4l-9.3-1.6c-0.6-2.1-1.5-4.1-2.6-6l5.4-7.8c0.6-0.8,0.5-2-0.3-2.7L80.1,17.2c-0.8-0.8-2-0.9-2.7-0.3l-7.8,5.4 c-1.9-1.1-3.9-2-6-2.6l-1.6-9.3c-0.2-1-1-1.7-2-1.7H40c-1,0-1.8,0.7-2,1.7l-1.6,9.3c-2.1,0.6-4.1,1.5-6,2.6l-7.8-5.4 c-0.8-0.6-2-0.5-2.7,0.3L11.8,25.3c-0.8,0.8-0.9,2-0.3,2.7l5.4,7.8c-1.1,1.9-2,3.9-2.6,6l-9.3,1.6c-1,0.2-1.7,1-1.7,2V60 c0,1,0.7,1.8,1.7,2l9.3,1.6c0.6,2.1,1.5,4.1,2.6,6l-5.4,7.8c-0.6,0.8-0.5,2,0.3,2.7l8.1,8.1c0.8,0.8,2,0.9,2.7,0.3l7.8-5.4 c1.9,1.1,3.9,2,6,2.6l1.6,9.3c0.2,1,1,1.7,2,1.7h20c1,0,1.8-0.7,2-1.7l1.6-9.3c2.1-0.6,4.1-1.5,6-2.6l7.8,5.4 c0.8,0.6,2,0.5,2.7-0.3l8.1-8.1c0.8-0.8,0.9-2,0.3-2.7l-5.4-7.8c1.1-1.9,2-3.9,2.6-6l9.3-1.6c1-0.2,1.7-1,1.7-2V45.4 C96.7,44.4,96,43.6,95,43.4z M50,65c-8.3,0-15-6.7-15-15s6.7-15,15-15s15,6.7,15,15S58.3,65,50,65z"
          />
        </svg>
        
        {/* Monitor Foreground */}
        <div className="relative z-10 bg-white p-1 rounded-md border-2 border-brand-navy shadow-sm">
          <div className="w-6 h-5 bg-brand-blue rounded-sm flex items-center justify-center overflow-hidden">
            {/* Cute Face */}
            <div className="flex gap-1.5 items-center">
              <div className="w-1 h-1 bg-white rounded-full" />
              <div className="w-1.5 h-0.5 bg-white rounded-full mt-1" />
              <div className="w-1 h-1 bg-white rounded-full" />
            </div>
          </div>
          <div className="w-2 h-0.5 bg-brand-navy mx-auto mt-0.5 rounded-full" />
        </div>
      </div>
      
      {!collapsed && (
        <div className="flex flex-col leading-none animate-in fade-in slide-in-from-left-2 duration-300">
          <span className="text-xl font-black tracking-tighter">
            <span className="text-brand-blue">Hype</span>
            <span className="text-brand-green">Remote</span>
          </span>
          <span className="text-[8px] uppercase tracking-[0.2em] font-black text-white/40 ml-0.5">
            Managed IT Platform
          </span>
        </div>
      )}
    </div>
  );
};

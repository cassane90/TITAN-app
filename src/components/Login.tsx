
import React, { useState } from 'react';
import { supabaseService } from '../services/supabaseService';
import { Icons } from '../constants';

const Login: React.FC = () => {
  const [connecting, setConnecting] = useState(false);

  const handleAuth = async () => {
    setConnecting(true);
    try {
      await supabaseService.signIn();
    } catch {
      alert("AUTH_NODE_FAILURE");
      setConnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 blur-[150px] rounded-full"></div>

      <div className="relative z-10 w-full max-w-xs text-center">
        <div className="w-24 h-24 border border-primary/20 bg-primary/5 flex items-center justify-center rounded-sm mb-12 mx-auto animate-pulse">
          <Icons.Terminal className="text-primary text-5xl" />
        </div>

        <h1 className="text-6xl font-black italic tracking-tighter uppercase leading-[0.8] mb-6 text-white">
          Titan<br/><span className="text-primary">System</span>
        </h1>

        <div className="flex items-center gap-3 justify-center mb-16">
          <span className="w-2 h-2 bg-hazard animate-ping rounded-full"></span>
          <p className="text-[10px] font-black text-hazard uppercase tracking-[0.5em]">Auth Protocol Required</p>
        </div>

        <button 
          onClick={handleAuth}
          disabled={connecting}
          className="group w-full h-16 bg-white flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_50px_rgba(255,255,255,0.1)] disabled:opacity-50"
        >
          {connecting ? (
             <div className="w-5 h-5 border-2 border-black border-t-transparent animate-spin rounded-full"></div>
          ) : (
            <>
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5 grayscale group-hover:grayscale-0" alt="G" />
              <span className="text-black text-sm font-black uppercase italic tracking-widest">Operator Login</span>
            </>
          )}
        </button>
      </div>

      <footer className="absolute bottom-10 text-[8px] font-black text-white/20 uppercase tracking-[0.8em]">Forensic Lab V3.1 // Production</footer>
    </div>
  );
};

export default Login;

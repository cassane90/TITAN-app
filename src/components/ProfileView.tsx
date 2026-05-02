
import React from 'react';
import { useApp } from '../providers/AppProvider';

const ProfileView: React.FC = () => {
  const { user, toggleTheme, theme, signOut, setShowPremiumModal } = useApp();

  return (
    <div className="flex flex-col gap-10 p-6 pb-32 animate-in fade-in slide-in-from-bottom-4 transition-colors duration-500">
      <div className="flex items-center gap-6 p-6 bg-panel-light dark:bg-white/5 border border-border-light dark:border-border-dark relative overflow-hidden transition-colors">
        <div className="w-20 h-20 bg-primary/10 border border-primary/20 flex items-center justify-center rounded-sm">
           <span className="material-symbols-outlined text-primary text-4xl">verified_user</span>
        </div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black uppercase italic tracking-tighter text-black dark:text-white truncate">
                {user?.email?.split('@')[0] || 'Operator'}
            </h2>
            {user?.is_premium && (
                <span className="bg-primary text-white text-[7px] font-black px-1.5 py-0.5 uppercase tracking-widest italic animate-pulse">PRO</span>
            )}
          </div>
          <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mt-1">{user?.is_premium ? 'Titan Senior Operator' : 'Standard Operator'}</p>
        </div>

        {/* Premium Upgrade Banner */}
      {!user?.is_premium && (
          <button 
            onClick={() => setShowPremiumModal(true)}
            className="group p-6 bg-primary text-white relative overflow-hidden transition-all hover:scale-[1.01] active:scale-[0.99] shadow-glow"
          >
             <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/20 transition-all"></div>
             <div className="relative z-10 flex items-center justify-between">
                <div className="text-left space-y-1">
                   <p className="text-[9px] font-black uppercase tracking-[0.3em] italic opacity-70">Toolkit Restricted</p>
                   <p className="text-sm font-black uppercase italic tracking-tighter">Unlock Advanced Forensic Tools</p>
                </div>
                <span className="material-symbols-outlined text-3xl opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all">chevron_right</span>
             </div>
          </button>
      )}

      <section className="space-y-4">
        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 px-4">Operator Identity</h4>
        <div className="bg-panel-light dark:bg-white/5 border border-border-light dark:border-border-dark p-6 space-y-4 transition-colors">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">Email Address</p>
              <p className="text-xs font-bold truncate">{user?.email}</p>
            </div>
            <button 
              onClick={signOut}
              className="text-[10px] font-black bg-hazard/10 text-hazard px-4 py-2 uppercase italic border border-hazard/20 hover:bg-hazard hover:text-white transition-all"
            >
              Disconnect
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 px-4">Telemetry Vital Signs</h4>
        <div className="bg-panel-light dark:bg-white/5 border border-border-light dark:border-border-dark p-6 grid grid-cols-2 gap-8 transition-colors">
           <div>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1 italic">Historical Audits</p>
              <p className="text-2xl font-black font-mono">{user?.query_count || 0}</p>
           </div>
           <div>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1 italic">Node Health</p>
              <p className="text-2xl font-black text-terminal-green uppercase italic tracking-tighter">OPTIMAL</p>
           </div>
        </div>
      </section>

      <section className="space-y-4">
        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 px-4">Visual Protocols</h4>
        <div className="bg-panel-light dark:bg-white/5 border border-border-light dark:border-border-dark divide-y divide-border-light dark:divide-white/5 transition-colors">
            <button onClick={toggleTheme} className="w-full p-6 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/[0.02] transition-all">
                <p className="text-sm font-black uppercase tracking-tight italic">Theme Override</p>
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-sm ${theme === 'dark' ? 'text-primary' : 'text-hazard'}`}>
                    {theme === 'dark' ? 'dark_mode' : 'light_mode'}
                  </span>
                  <span className="text-[10px] font-black text-primary uppercase">{theme} Mode</span>
                </div>
            </button>
        </div>
      </section>
    </div>
  );
};

export default ProfileView;

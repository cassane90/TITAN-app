
import React from 'react';
import { useApp } from '../providers/AppProvider';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, onNavigate }) => {
  const { theme, toggleTheme } = useApp();

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-black dark:text-white flex flex-col max-w-md mx-auto border-x border-border-light dark:border-border-dark relative shadow-2xl transition-colors duration-500">
      <header className="sticky top-0 z-[100] bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-xl border-b border-border-light dark:border-border-dark p-5 flex items-center justify-between transition-colors duration-500">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 border border-primary/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-xl">biotech</span>
          </div>
          <div>
            <h1 className="text-xs font-black uppercase italic tracking-widest leading-none">Titan</h1>
            <p className="text-[9px] font-bold opacity-30 uppercase mt-0.5 tracking-tighter">Forensic_Node_Active</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="group flex items-center gap-2 px-3 py-1.5 border border-border-light dark:border-border-dark hover:border-primary transition-all"
            title="Toggle Neural Interface"
          >
            <span className={`material-symbols-outlined text-base ${theme === 'dark' ? 'text-primary' : 'text-hazard'}`}>
              {theme === 'dark' ? 'dark_mode' : 'light_mode'}
            </span>
            <span className="text-[8px] font-black uppercase tracking-widest hidden xs:block">
              {theme === 'dark' ? 'Override' : 'Restore'}
            </span>
          </button>

          <div className="flex items-center gap-1.5 px-2 py-1.5 bg-terminal-green/10 border border-terminal-green/20">
             <span className="w-1.5 h-1.5 bg-terminal-green rounded-full animate-pulse"></span>
             <span className="text-[8px] font-black text-terminal-green uppercase">Sync</span>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-32 overflow-x-hidden">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-2xl border-t border-border-light dark:border-border-dark h-24 flex items-center justify-around px-4 z-[200] transition-colors duration-500">
        <NavBtn active={currentView === 'home'} icon="grid_view" label="Logs" onClick={() => onNavigate('home')} />
        <NavBtn active={currentView === 'scan'} icon="add_box" label="Scan" onClick={() => onNavigate('scan')} />
        <NavBtn active={currentView === 'profile'} icon="settings" label="Node" onClick={() => onNavigate('profile')} />
      </nav>
    </div>
  );
};

const NavBtn = ({ active, icon, label, onClick }: { active: boolean; icon: string; label: string; onClick: () => void }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1.5 w-1/4 transition-all ${active ? 'text-primary scale-110' : 'opacity-30 hover:opacity-100 hover:text-primary'}`}>
    <span className="material-symbols-outlined text-2xl">{icon}</span>
    <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

export default Layout;

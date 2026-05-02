
import React, { useState } from 'react';
import { UserRole } from '../types';
import { useApp } from '../providers/AppProvider';

const Onboarding: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { updateUser, refreshState } = useApp();
  const [role, setRole] = useState<UserRole | null>(null);

  const handleInit = async () => {
    if (!role) return;
    await updateUser({ role, onboarding_accepted: true });
    await refreshState();
    onComplete();
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 flex flex-col justify-center max-w-md mx-auto">
      <header className="mb-12">
        <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-none mb-2">Protocol<br/><span className="text-primary">Initialization</span></h2>
        <p className="text-[10px] font-bold text-primary/40 uppercase tracking-[0.3em]">Select Forensic Class</p>
      </header>

      <div className="space-y-2 mb-12">
        {Object.values(UserRole).map(r => (
          <button 
            key={r}
            onClick={() => setRole(r)}
            className={`w-full p-6 text-left border transition-all ${role === r ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white/5 border-white/10 text-white/50 hover:border-primary/50'}`}
          >
            <p className="text-[11px] font-black uppercase tracking-widest italic">{r}</p>
          </button>
        ))}
      </div>

      <button 
        disabled={!role}
        onClick={handleInit}
        className="w-full bg-white text-black py-6 font-black uppercase tracking-[0.4em] italic shadow-glow disabled:opacity-10"
      >
        Establish Node
      </button>
    </div>
  );
};

export default Onboarding;

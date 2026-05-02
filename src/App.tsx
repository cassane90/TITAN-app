import React, { useState } from 'react';
import { AppProvider, useApp } from './providers/AppProvider';
import Onboarding from './components/Onboarding';
import Layout from './components/Layout';
import DiagnosticForm from './components/DiagnosticForm';
import ResultCard from './components/ResultCard';
import HistoryList from './components/HistoryList';
import ProfileView from './components/ProfileView';
import Login from './components/Login';
import PremiumModal from './components/PremiumModal';
import { QueryRecord } from './types';

const Main: React.FC = () => {
  const { isLoading, user, history, isAuthenticated, showPremiumModal, setShowPremiumModal } = useApp();
  const [view, setView] = useState<'home' | 'scan' | 'result' | 'profile'>('home');
  const [selectedLog, setSelectedLog] = useState<QueryRecord | null>(null);

  if (isLoading) return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-primary border-t-transparent animate-spin"></div>
        <p className="text-[10px] font-black text-primary uppercase tracking-[0.5em] italic">Synthesizing Environment...</p>
      </div>
    </div>
  );

  if (!isAuthenticated) return <Login />;

  if (user && !user.onboarding_accepted) return <Onboarding onComplete={() => setView('home')} />;

  const handleInspect = (log: QueryRecord) => {
    setSelectedLog(log);
    setView('result');
  };

  return (
    <Layout currentView={view} onNavigate={(v) => setView(v as typeof view)}>
      {view === 'home' && (
        <div className="p-6 space-y-10 animate-in fade-in slide-in-from-bottom-4">
          <header className="space-y-1">
            <h2 className="text-5xl font-black italic uppercase tracking-tighter text-black dark:text-white">Neural<br /><span className="text-primary">Registry</span></h2>
            <p className="text-[9px] font-bold text-primary uppercase opacity-40 tracking-[0.3em]">Status: Ready // Node: 0x4F2A</p>
          </header>
          <button
            onClick={() => setView('scan')}
            className="w-full bg-primary text-white py-6 rounded-sm font-black uppercase tracking-[0.4em] italic shadow-[0_0_40px_rgba(19,127,236,0.2)] hover:scale-[1.02] active:scale-95 transition-all"
          >
            Start Diagnostic
          </button>
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black uppercase tracking-[0.5em] opacity-30">Forensic History</h3>
              <span className="text-[10px] font-black text-primary">{history.length} Logs</span>
            </div>
            <HistoryList onSelect={handleInspect} />
          </section>
        </div>
      )}
      {view === 'scan' && <DiagnosticForm onSuccess={handleInspect} onCancel={() => setView('home')} />}
      {view === 'result' && selectedLog && <ResultCard record={selectedLog} onBack={() => setView('home')} />}
      {view === 'profile' && <ProfileView />}

      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
      />
    </Layout>
  );
};

export default function App() {
  return (
    <AppProvider>
      <Main />
    </AppProvider>
  );
}

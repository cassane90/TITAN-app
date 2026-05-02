
import React from 'react';
import { Icons } from '../constants';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PremiumModal: React.FC<PremiumModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-background-light dark:bg-background-dark border border-white/10 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2"></div>

        <div className="p-8 space-y-8 relative z-10">
          <header className="text-center space-y-2">
            <div className="w-12 h-12 bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4 rounded-full">
              <Icons.Circuit className="text-primary text-2xl" />
            </div>
            <h2 className="text-2xl font-black tracking-tighter uppercase italic">TITAN <span className="text-primary">PRO</span></h2>
            <p className="text-[10px] font-bold uppercase opacity-40 leading-relaxed max-w-[200px] mx-auto">Advanced forensic tools — coming soon.</p>
          </header>

          <div className="p-4 bg-black/5 dark:bg-white/5 border border-border-light dark:border-white/5 space-y-4">
            <BenefitItem icon="picture_as_pdf" text="Unlimited PDF Audit Exports" />
            <BenefitItem icon="biotech" text="Component-Level Failure Prediction" />
            <BenefitItem icon="cloud_sync" text="Global History & Cloud Sync" />
            <BenefitItem icon="verified" text="AI Priority Processing" />
          </div>

          <div className="space-y-3">
            <div className="w-full py-4 bg-black/10 dark:bg-white/10 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 italic">Subscriptions Coming Soon</p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-2 text-[8px] font-black uppercase tracking-widest opacity-30 hover:opacity-100 transition-opacity"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const BenefitItem = ({ icon, text }: { icon: string; text: string }) => (
  <div className="flex items-center gap-3">
    <span className="material-symbols-outlined text-primary text-xs">{icon}</span>
    <p className="text-[9px] font-black uppercase tracking-tight opacity-70">{text}</p>
  </div>
);

export default PremiumModal;

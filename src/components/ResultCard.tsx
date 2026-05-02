import React from 'react';
import { QueryRecord } from '../types';
import { formatCurrency, Icons } from '../constants';
import { useApp } from '../providers/AppProvider';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ResultCardProps {
  record: QueryRecord;
  onBack: () => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ record, onBack }) => {
  const { 
    brand, model, confidence_score, risk_level, reasoning, recommended_action, resale_value, currency_code, recommended_repair_hubs,
    diy_guides, required_tools, purchase_options, parts_retailers, category_mismatch, identified_category, no_visible_issue, common_failures,
  } = record.ai_response;

  const { setShowPremiumModal } = useApp();

  const exportReport = async () => {
    const element = document.getElementById('forensic-report');
    if (!element) return;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#000000'
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Forensic_Report_${model.replace(/\s+/g, '_')}.pdf`);
  };

  const [diyState, setDiyState] = React.useState<'locked' | 'confirm' | 'unlocked'>('locked');
  const [jsonCopied, setJsonCopied] = React.useState(false);
  const repairHubsRef = React.useRef<HTMLDivElement>(null);

  const scrollToSpecialists = () => {
    setDiyState('locked');
    repairHubsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // HCI: USER CONTROL (Shneiderman #7) — let users access the raw data
  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(record.ai_response, null, 2));
      setJsonCopied(true);
      setTimeout(() => setJsonCopied(false), 2000);
    } catch {
      // Fallback for browsers without clipboard API
      const el = document.createElement('textarea');
      el.value = JSON.stringify(record.ai_response, null, 2);
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setJsonCopied(true);
      setTimeout(() => setJsonCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col bg-background-light dark:bg-background-dark min-h-screen text-black dark:text-white pb-40 transition-colors duration-500">
      {/* Non-Export Header */}
      <header data-html2canvas-ignore className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-border-light dark:border-border-dark transition-colors">
        <button onClick={onBack} className="w-10 h-10 border border-border-light dark:border-border-dark flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="text-[10px] font-black tracking-[0.5em] uppercase opacity-40">Forensic Audit Result</h2>
        <div className="w-10"></div>
      </header>

      {/* Exportable Report Content */}
      <main id="forensic-report" className="p-6 space-y-10 bg-background-light dark:bg-background-dark">
        {/* Category Mismatch Warning */}
        {category_mismatch && (
          <div className="p-5 bg-primary/5 border border-primary/20 flex gap-4 items-center animate-in fade-in slide-in-from-top-4 duration-1000">
            <span className="material-symbols-outlined text-primary text-xl">info</span>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary italic">Quick Tip</p>
              <p className="text-[9px] font-bold uppercase opacity-60 leading-relaxed">
                You selected: <span className="text-primary">{record.category}</span> but we detected: <span className="text-primary">{identified_category}</span>. 
                Next time, try selecting the correct category for better results.
              </p>
            </div>
          </div>
        )}

        {/* No Visible Issue Alert */}
        {no_visible_issue && (
          <div className="p-6 bg-yellow-500/10 border-2 border-yellow-500/30 flex gap-4 items-start animate-in fade-in slide-in-from-top-4 duration-1000">
            <span className="material-symbols-outlined text-yellow-500 text-2xl">help</span>
            <div className="space-y-2 flex-1">
              <p className="text-[11px] font-black uppercase tracking-widest text-yellow-500 italic">No Obvious Issue Detected</p>
              <p className="text-[10px] font-bold uppercase opacity-80 leading-relaxed">
                This device appears to be in good condition with no visible damage. 
                <span className="text-yellow-500"> Please describe the specific issue you're experiencing</span> so we can provide an accurate diagnosis.
              </p>
              <button data-html2canvas-ignore onClick={onBack} className="mt-3 px-4 py-2 bg-yellow-500 text-black text-[9px] font-black uppercase tracking-widest hover:bg-yellow-400 transition-colors">
                Add Issue Description
              </button>
            </div>
          </div>
        )}

        {/* Device Profile */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.2em] border ${risk_level === 'High' || risk_level === 'Extreme' ? 'bg-hazard/10 text-hazard border-hazard/20' : 'bg-terminal-green/10 text-terminal-green border-terminal-green/20'}`}>
               {risk_level} Risk Level
            </span>
            <span className="text-[9px] font-mono opacity-30 uppercase">Match {Math.round(confidence_score)}%</span>
          </div>
          <h1 className="text-5xl font-black leading-[0.85] tracking-tighter uppercase italic mb-4">
            {brand} <span className="text-primary">{model}</span>
          </h1>
        </section>

        {/* Intelligence Layer */}
        {(record.ai_response.technical_specs || (common_failures && common_failures.length > 0)) && (
             <div className="space-y-4">
                {/* Tech Specs */}
                {record.ai_response.technical_specs && (
                    <div className="grid grid-cols-2 gap-2 bg-panel-light dark:bg-white/5 p-4 border border-border-light dark:border-white/10 rounded-xl">
                        {Object.entries(record.ai_response.technical_specs).map(([key, value]) => (
                            <div key={key} className="flex flex-col">
                                <span className="text-[8px] font-black uppercase opacity-40">{key}</span>
                                <span className="text-[10px] font-mono font-bold uppercase">{String(value)}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Common Failures */}
                {common_failures && common_failures.length > 0 && (
                    <div className="bg-hazard/5 border border-hazard/20 p-4 rounded-xl relative overflow-hidden group">
                        <div className="flex items-center gap-2 mb-3">
                            <Icons.Hazard className="text-hazard text-xs" />
                            <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-hazard">Failure Probability Audit</h4>
                        </div>
                        <div className="space-y-2">
                            {common_failures.map((fail: string, i: number) => (
                                <div key={i} className="flex items-start gap-2">
                                    <div className="w-1 h-1 bg-hazard rounded-full mt-1.5 shrink-0"></div>
                                    <p className="text-[10px] font-bold uppercase tracking-tight opacity-70">{fail}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* Financial Audit */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
             <Icons.Circuit className="text-primary text-sm" />
             <h3 className="text-[10px] font-black tracking-[0.4em] uppercase opacity-40">Value Breakdown</h3>
          </div>
          <div className="grid grid-cols-3 bg-panel-light dark:bg-white/5 border border-border-light dark:border-border-dark divide-x divide-border-light dark:divide-white/10">
             <div className="p-4 text-center">
                <p className="text-[8px] font-black uppercase opacity-40 mb-2 italic">Broken</p>
                <p className="text-sm font-black font-mono">{formatCurrency(resale_value.unit_value_broken, currency_code)}</p>
             </div>
             <div className="p-4 text-center">
                <p className="text-[8px] font-black uppercase opacity-40 mb-2 italic">Fixed</p>
                <p className="text-sm font-black font-mono">{formatCurrency(resale_value.unit_value_fixed, currency_code)}</p>
             </div>
             <div className="p-4 text-center bg-primary/5 dark:bg-primary/10">
                <p className="text-[8px] font-black uppercase text-primary mb-2 italic">Profit</p>
                <p className="text-sm font-black font-mono text-primary">{formatCurrency(resale_value.profit_potential, currency_code)}</p>
             </div>
          </div>
        </section>

        {/* Market Analysis */}
        {(purchase_options?.length > 0 || parts_retailers?.length > 0) && (
          <section className="space-y-6">
             <div className="flex items-center gap-2 px-2">
                <span className="material-symbols-outlined text-primary text-sm">shopping_cart</span>
                <h3 className="text-[10px] font-black tracking-[0.4em] uppercase opacity-40">Market Options</h3>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Purchase Options */}
                {purchase_options?.length > 0 && (
                   <div className="space-y-3">
                      <h4 className="text-[9px] font-black uppercase tracking-widest opacity-40 px-1 italic">Replacement Units</h4>
                      <div className="space-y-2">
                         {purchase_options.map((opt: { uri: string; name: string; is_new: boolean; price: string }, i: number) => (
                            <a key={i} href={opt.uri} target="_blank" rel="noopener noreferrer" className="block p-4 bg-panel-light dark:bg-white/5 border border-border-light dark:border-border-dark hover:border-primary transition-all">
                               <div className="flex justify-between items-center">
                                  <div>
                                     <p className="text-[10px] font-black uppercase">{opt.name}</p>
                                     <span className="text-[8px] font-bold opacity-30 uppercase">{opt.is_new ? 'Brand New' : 'Used/Refurb'}</span>
                                  </div>
                                  <p className="text-xs font-black text-primary font-mono">{opt.price}</p>
                               </div>
                            </a>
                         ))}
                      </div>
                   </div>
                )}

                {/* Parts Retailers */}
                {parts_retailers?.length > 0 && (
                   <div className="space-y-3">
                      <h4 className="text-[9px] font-black uppercase tracking-widest opacity-40 px-1 italic">Component Sourcing</h4>
                      <div className="space-y-2">
                         {parts_retailers.map((part: {uri: string; part_name: string; name: string}, i: number) => (
                            <a key={i} href={part.uri} target="_blank" rel="noopener noreferrer" className="block p-4 bg-panel-light dark:bg-white/5 border border-border-light dark:border-border-dark hover:border-terminal-green transition-all">
                               <p className="text-[10px] font-black uppercase">{part.part_name}</p>
                               <p className="text-[8px] font-bold opacity-30 uppercase">via {part.name}</p>
                            </a>
                         ))}
                      </div>
                   </div>
                )}
             </div>
          </section>
        )}

        {/* Recommended Action */}
        <section className="bg-primary dark:bg-white text-white dark:text-black p-8 relative overflow-hidden transition-colors duration-500 shadow-xl">
           <div className="absolute top-0 left-0 w-2 h-full bg-white dark:bg-primary opacity-20 dark:opacity-100"></div>
           <h4 className="text-[10px] font-black uppercase tracking-[0.5em] mb-4 italic opacity-70">Forensic Conclusion</h4>
           <p className="text-4xl font-black italic uppercase leading-none mb-6 tracking-tighter">{recommended_action}</p>
           <p className="text-xs font-bold leading-relaxed uppercase opacity-80">{reasoning}</p>
        </section>

        {/* Repair Hubs */}
        <section className="space-y-4" ref={repairHubsRef}>
          <div className="flex items-center gap-2 px-2">
             <Icons.Radar className="text-primary text-sm" />
             <h3 className="text-[10px] font-black tracking-[0.4em] uppercase opacity-40">Local Specialists</h3>
          </div>
          <div className="space-y-2">
             {recommended_repair_hubs && recommended_repair_hubs.length > 0 ? (
               recommended_repair_hubs.map((hub: {uri: string; name: string; rating: string; address: string}, i: number) => (
                 <a key={i} href={hub.uri} target="_blank" rel="noopener noreferrer" className="block p-5 bg-panel-light dark:bg-white/5 border border-border-light dark:border-border-dark hover:border-primary transition-all group">
                    <div className="flex justify-between items-start mb-2">
                       <p className="text-sm font-black uppercase italic group-hover:text-primary">{hub.name}</p>
                       <span className="text-[10px] font-black text-terminal-green uppercase">{hub.rating} ★</span>
                    </div>
                    <p className="text-[9px] font-bold opacity-40 uppercase truncate">{hub.address}</p>
                 </a>
               ))
             ) : (
               <div className="p-6 border border-dashed border-border-light dark:border-border-dark opacity-50 text-center space-y-2 bg-panel-light/30 dark:bg-white/5">
                  <span className="material-symbols-outlined text-xl opacity-50">location_off</span>
                  <p className="text-[10px] font-black uppercase">Location Offline</p>
                  <p className="text-[8px] leading-relaxed uppercase whitespace-pre-wrap">Geospatial data is required to map local repair centers.</p>
               </div>
             )}
          </div>
        </section>

        {/* DIY Expansion Slot */}
        <section className="pt-10 border-t border-border-light dark:border-white/10 space-y-6">
           <div className="flex items-center gap-2 px-2">
              <span className="material-symbols-outlined text-primary text-sm">build</span>
              <h3 className="text-[10px] font-black tracking-[0.4em] uppercase opacity-40">Self-Repair Protocols</h3>
           </div>

           {diyState === 'locked' && (
              <div className="p-8 bg-panel-light dark:bg-white/5 border border-border-light dark:border-border-dark space-y-6">
                 <div className="space-y-2">
                    <p className="text-xs font-black uppercase italic text-hazard">High Risk Protocol</p>
                    <p className="text-[10px] font-bold uppercase opacity-60 leading-relaxed">
                       Unauthorized hardware tampering may lead to permanent component destruction. 
                    </p>
                 </div>
                 <button 
                  onClick={() => setDiyState('confirm')}
                  className="w-full bg-black dark:bg-white text-white dark:text-black py-4 text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all"
                 >
                    Unlock Guides
                 </button>
              </div>
           )}

           {diyState === 'confirm' && (
              <div className="p-8 bg-hazard/5 border border-hazard/30 space-y-6 animate-pulse">
                 <p className="text-center text-sm font-black uppercase italic">Confirm Your Decision</p>
                 <p className="text-center text-[9px] font-bold uppercase opacity-60">
                    DIY repairs carry real risk. Only proceed if you are confident.
                 </p>
                 <div className="flex gap-4">
                    {/* HCI: CONSISTENCY — plain English replaces 'Authorize' (Shneiderman #1) */}
                    <button
                      onClick={() => setDiyState('unlocked')}
                      className="flex-1 bg-hazard text-white py-4 font-black uppercase tracking-widest text-[10px]"
                    >
                      I Understand, Proceed
                    </button>
                    {/* HCI: FEEDBACK — label explains what 'Abort' actually does (Nielsen #9) */}
                    <button
                      onClick={scrollToSpecialists}
                      className="flex-1 bg-black/5 dark:bg-white/10 py-4 font-black uppercase tracking-widest text-[10px]"
                    >
                      Take me to Specialists
                    </button>
                 </div>
              </div>
           )}

           {diyState === 'unlocked' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                 {/* Tools */}
                 <div className="space-y-4">
                    <h4 className="text-[9px] font-black uppercase tracking-widest opacity-40 px-2 italic">Essential Hardware Tools</h4>
                    <div className="grid grid-cols-1 gap-2">
                       {required_tools && required_tools.length > 0 ? (
                         required_tools.map((tool: {name: string; reason: string; link?: string}, i: number) => (
                           <div key={i} className="p-4 bg-panel-light dark:bg-white/5 border border-border-light dark:border-border-dark flex justify-between items-center group">
                              <div>
                                 <p className="text-xs font-black uppercase">{tool.name}</p>
                                 <p className="text-[9px] font-medium opacity-40 uppercase mt-0.5">{tool.reason}</p>
                              </div>
                              {tool.link && (
                                <a href={tool.link} target="_blank" rel="noopener noreferrer" className="material-symbols-outlined text-primary text-xl opacity-0 group-hover:opacity-100 transition-opacity">shopping_cart</a>
                              )}
                           </div>
                         ))
                       ) : (
                         <p className="text-[10px] italic opacity-40 px-2 uppercase tracking-tight font-bold">Standard precision tools only.</p>
                       )}
                    </div>
                 </div>

                 {/* Guides */}
                 <div className="space-y-4">
                    <h4 className="text-[9px] font-black uppercase tracking-widest opacity-40 px-2 italic">Technical Documentation</h4>
                    <div className="space-y-2">
                       {diy_guides && diy_guides.length > 0 ? (
                         diy_guides.map((guide: {uri: string; title: string; platform: string; author?: string; difficulty: string; duration?: string}, i: number) => (
                           <a key={i} href={guide.uri} target="_blank" rel="noopener noreferrer" className="block p-5 bg-panel-light dark:bg-white/5 border border-border-light dark:border-border-dark hover:border-primary transition-all group">
                               <div className="flex justify-between items-start mb-2">
                                 <p className="text-sm font-black uppercase italic group-hover:text-primary leading-tight pr-4">{guide.title}</p>
                                 <div className="text-right">
                                    <span className="text-[9px] font-black text-primary uppercase whitespace-nowrap block">{guide.platform}</span>
                                    {guide.author && <span className="text-[8px] font-bold opacity-40 uppercase whitespace-nowrap">by {guide.author}</span>}
                                 </div>
                              </div>
                              <div className="flex gap-4">
                                 <span className="text-[8px] font-black opacity-40 uppercase tracking-widest italic">{guide.difficulty}</span>
                                 {guide.duration && <span className="text-[8px] font-black opacity-40 uppercase tracking-widest italic">{guide.duration}</span>}
                              </div>
                           </a>
                         ))
                       ) : (
                         <p className="text-[10px] italic opacity-40 px-2 uppercase tracking-tight font-bold">No public guides available for this model.</p>
                       )}
                    </div>
                 </div>
              </div>
           )}
        </section>
      </main>

      {/* Persistent Action Bar */}
      <footer data-html2canvas-ignore className="fixed bottom-0 left-0 right-0 p-6 bg-background-light dark:bg-background-dark/90 backdrop-blur-xl border-t border-border-light dark:border-border-dark flex gap-4 max-w-md mx-auto w-full z-50 transition-colors">
         {/* HCI: USER CONTROL (Shneiderman #7) — users can access raw data via clipboard copy */}
         <button
           onClick={handleCopyJson}
           aria-label="Copy raw diagnosis JSON to clipboard"
           className="flex-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black dark:text-white py-5 font-black uppercase tracking-[0.3em] italic active:scale-95 transition-all flex items-center justify-center gap-2"
         >
           <span className="material-symbols-outlined text-sm">{jsonCopied ? 'check' : 'data_object'}</span>
           {jsonCopied ? 'Copied!' : 'Copy JSON'}
         </button>
         <button
          onClick={exportReport}
          aria-label="Download PDF report"
          className="flex-1 bg-black dark:bg-white text-white dark:text-black py-5 font-black uppercase tracking-[0.3em] italic active:scale-95 transition-all shadow-glow"
        >
          Download PDF
        </button>
      </footer>
    </div>
  );
};

export default ResultCard;


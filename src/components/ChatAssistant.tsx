
import React, { useState, useRef, useEffect } from 'react';
import { Icons } from '../constants';
import { chatWithAssistant } from '../services/geminiService';
import { ChatMessage } from '../types';

const ChatAssistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'ai', text: 'TITAN Support System Online. Querying database for component pricing and schematics.' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const response = await chatWithAssistant(userMsg);
      setMessages(prev => [...prev, response]);
    } catch (e: unknown) {
      setMessages(prev => [...prev, { role: 'ai', text: `System Alert: ${(e as Error)?.message || "Communication node offline."}` }]);
    } finally {
      setIsTyping(false);
    }
  };

  const formatUrl = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return 'Source';
    }
  };

  return (
    <div className="glass-panel border border-white/10 rounded-3xl h-[650px] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-8 shadow-card">
      <div className="p-5 border-b border-white/5 bg-surface/50 backdrop-blur-md flex items-center gap-4">
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-indigo-600 text-white rounded-xl flex items-center justify-center shadow-glow">
          <Icons.Chat className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold font-display text-lg text-white">TITAN Support</h3>
          <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-[0.2em]">Neural Link Active</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-primary text-white' : 'bg-surface-highlight text-gray-100'}`}>
              {m.text}
            </div>
            {m.sources && m.sources.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                    {m.sources.map((src, idx) => (
                        <a key={idx} href={src} target="_blank" rel="noopener" className="px-2 py-1 bg-black/20 rounded text-[9px] text-text-muted hover:text-primary border border-white/5 font-mono">{formatUrl(src)}</a>
                    ))}
                </div>
            )}
          </div>
        ))}
        {isTyping && <div className="text-xs text-primary animate-pulse font-mono">Querying...</div>}
        <div ref={scrollRef}></div>
      </div>

      <div className="p-4 bg-surface/80 border-t border-white/5">
        <div className="flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Technical query..."
            className="flex-1 bg-black/30 border border-white/10 rounded-xl px-5 py-4 text-sm text-white focus:border-primary outline-none"
          />
          <button onClick={handleSend} disabled={isTyping} className="p-4 bg-primary text-white rounded-xl hover:scale-105 transition-transform">
            <Icons.ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistant;

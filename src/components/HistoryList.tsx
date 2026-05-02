
import React from 'react';
import { useApp } from '../providers/AppProvider';
import { QueryRecord } from '../types';

interface HistoryListProps {
  onSelect: (record: QueryRecord) => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ onSelect }) => {
  const { history } = useApp();

  if (history.length === 0) {
    return (
      <div className="py-12 text-center space-y-2">
        <span className="material-symbols-outlined text-3xl opacity-20">history</span>
        <p className="text-[10px] font-black uppercase tracking-widest opacity-20">No diagnostics yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {history.map(record => (
        <div
          key={record.id}
          onClick={() => onSelect(record)}
          className="grid grid-cols-12 gap-0 border-b border-border-light dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 group transition-colors cursor-pointer"
        >
          <div className="col-span-2 p-4 text-[10px] font-bold text-primary border-r border-border-light dark:border-white/5 flex items-center">
            #{record.id.slice(-4)}
          </div>
          <div className="col-span-6 p-4 border-r border-border-light dark:border-white/5 flex flex-col justify-center">
            <span className="text-xs font-bold text-black dark:text-white group-hover:text-primary transition-colors">
              {record.ai_response.brand} {record.ai_response.model}
            </span>
            <span className="text-[9px] text-black/40 dark:text-white/40 uppercase tracking-wider font-mono mt-1">
              {record.category} / {new Date(record.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="col-span-4 p-4 flex items-center justify-center">
            <span className={`px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase border ${
              record.ai_response.confidence_score > 90
                ? 'bg-terminal-green/10 text-terminal-green border-terminal-green/20'
                : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
            }`}>
              {record.ai_response.confidence_score > 90 ? 'Pass' : 'Flag'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HistoryList;
